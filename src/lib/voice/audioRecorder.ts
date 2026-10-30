/**
 * ISA — Enregistreur audio (microphone)
 * =====================================
 * Produit un WAV PCM 16 bits / 16 kHz mono : c'est le format le plus sûr pour
 * les moteurs de reconnaissance locaux (faster-whisper, MMS-ASR) et il évite
 * les problèmes de codec `webm/opus` non décodables sur certains serveurs.
 *
 * Repli automatique sur MediaRecorder si l'AudioContext ne permet pas le
 * capture en temps réel (anciens navigateurs).
 */

export interface RecordedAudio {
  blob: Blob;
  mimeType: string;
  durationMs: number;
  sampleRate: number;
  format: 'wav' | 'webm' | 'mp4' | 'ogg';
}

const TARGET_SAMPLE_RATE = 16000;

export function isMicrophoneSupported(): boolean {
  return typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && typeof AudioContext !== 'undefined';
}

export async function hasMicrophonePermission(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.permissions?.query) return false;
  try {
    const status = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return status.state === 'granted';
  } catch {
    return false;
  }
}

/** Encode un Float32Array mono en WAV 16 bits PCM. */
export function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i += 1, offset += 2) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

/** Ré-échantillonne un Float32Array vers 16 kHz (Whisper/MMS attendent 16 kHz). */
export function resampleTo16k(input: Float32Array, inputRate: number): Float32Array {
  if (inputRate === TARGET_SAMPLE_RATE) return input;
  const ratio = inputRate / TARGET_SAMPLE_RATE;
  const outputLength = Math.floor(input.length / ratio);
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i += 1) {
    const start = Math.floor(i * ratio);
    const end = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    let count = 0;
    for (let j = start; j < end; j += 1) {
      sum += input[j];
      count += 1;
    }
    output[i] = count ? sum / count : 0;
  }
  return output;
}

/** Niveau sonore instantané (0 → 1) pour animer l'orbe pendant l'écoute. */
export type LevelListener = (level: number) => void;

export class VoiceRecorder {
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private chunks: Float32Array[] = [];
  private mediaRecorder: MediaRecorder | null = null;
  private mediaChunks: Blob[] = [];
  private startedAt = 0;
  private sampleRate = TARGET_SAMPLE_RATE;
  private recording = false;

  get isRecording(): boolean {
    return this.recording;
  }

  async start(onLevel?: LevelListener): Promise<void> {
    if (this.recording) return;
    if (!isMicrophoneSupported()) throw new Error('MICROPHONE_UNSUPPORTED');

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.chunks = [];
    this.mediaChunks = [];
    this.startedAt = Date.now();

    const AudioCtx: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    try {
      this.context = new AudioCtx();
      await this.context.resume();
      this.sampleRate = this.context.sampleRate;
      this.source = this.context.createMediaStreamSource(this.stream);
      // 4096 échantillons : bon compromis latence / stabilité sur mobile.
      this.processor = this.context.createScriptProcessor(4096, 1, 1);
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 512;

      const levelData = new Uint8Array(this.analyser.frequencyBinCount);
      this.processor.onaudioprocess = (event) => {
        const channel = event.inputBuffer.getChannelData(0);
        this.chunks.push(new Float32Array(channel));
        if (onLevel && this.analyser) {
          this.analyser.getByteTimeDomainData(levelData);
          let peak = 0;
          for (let i = 0; i < levelData.length; i += 1) {
            const deviation = Math.abs(levelData[i] - 128) / 128;
            if (deviation > peak) peak = deviation;
          }
          onLevel(Math.min(1, peak * 2.2));
        }
      };

      this.source.connect(this.processor);
      this.source.connect(this.analyser);
      this.processor.connect(this.context.destination);
      this.recording = true;
      return;
    } catch {
      // AudioContext indisponible → MediaRecorder
      await this.startWithMediaRecorder();
    }
  }

  private async startWithMediaRecorder(): Promise<void> {
    if (!this.stream) throw new Error('MICROPHONE_UNSUPPORTED');
    const mimeCandidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    const mimeType = mimeCandidates.find((candidate) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(candidate));
    if (typeof MediaRecorder === 'undefined' || !mimeType) throw new Error('RECORDER_UNSUPPORTED');

    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
    this.mediaChunks = [];
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) this.mediaChunks.push(event.data);
    };
    this.mediaRecorder.start(250);
    this.recording = true;
  }

  async stop(): Promise<RecordedAudio | null> {
    if (!this.recording) return null;
    this.recording = false;
    const durationMs = Date.now() - this.startedAt;

    const cleanup = () => {
      try {
        this.processor?.disconnect();
        this.source?.disconnect();
        this.analyser?.disconnect();
      } catch {
        /* noop */
      }
      if (this.processor) this.processor.onaudioprocess = null;
      this.processor = null;
      this.source = null;
      this.analyser = null;
      this.stream?.getTracks().forEach((track) => track.stop());
      this.stream = null;
      void this.context?.close().catch(() => undefined);
      this.context = null;
      this.mediaRecorder = null;
    };

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      return new Promise<RecordedAudio>((resolve) => {
        const recorder = this.mediaRecorder!;
        recorder.onstop = () => {
          const blob = new Blob(this.mediaChunks, { type: recorder.mimeType || 'audio/webm' });
          const format: RecordedAudio['format'] = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm';
          cleanup();
          resolve(blob.size ? { blob, mimeType: blob.type, durationMs, sampleRate: TARGET_SAMPLE_RATE, format } : null);
        };
        recorder.stop();
      });
    }

    const merged = new Float32Array(this.chunks.reduce((total, chunk) => total + chunk.length, 0));
    let writeIndex = 0;
    this.chunks.forEach((chunk) => {
      merged.set(chunk, writeIndex);
      writeIndex += chunk.length;
    });
    this.chunks = [];
    cleanup();

    if (!merged.length || durationMs < 350) return null;
    const resampled = resampleTo16k(merged, this.sampleRate);
    return {
      blob: encodeWav(resampled, TARGET_SAMPLE_RATE),
      mimeType: 'audio/wav',
      durationMs,
      sampleRate: TARGET_SAMPLE_RATE,
      format: 'wav',
    };
  }

  abort(): void {
    this.recording = false;
    this.chunks = [];
    this.mediaChunks = [];
    try {
      this.processor?.disconnect();
      this.source?.disconnect();
      this.stream?.getTracks().forEach((track) => track.stop());
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') this.mediaRecorder.stop();
      void this.context?.close().catch(() => undefined);
    } catch {
      /* noop */
    }
    this.processor = null;
    this.source = null;
    this.stream = null;
    this.context = null;
    this.mediaRecorder = null;
  }
}

/**
 * Convertit un fichier audio (upload) en WAV 16 kHz mono, pour que le serveur
 * local puisse le traiter avec Whisper quel que soit le format d'origine.
 */
export async function decodeAudioFileToWav(file: File | Blob): Promise<RecordedAudio> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioCtx: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const context = new AudioCtx();
  try {
    const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
    const channelData = audioBuffer.getChannelData(0);
    const resampled = resampleTo16k(channelData, audioBuffer.sampleRate);
    return {
      blob: encodeWav(resampled, TARGET_SAMPLE_RATE),
      mimeType: 'audio/wav',
      durationMs: Math.round(audioBuffer.duration * 1000),
      sampleRate: TARGET_SAMPLE_RATE,
      format: 'wav',
    };
  } finally {
    void context.close().catch(() => undefined);
  }
}
