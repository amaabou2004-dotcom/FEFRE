import type { VoiceLanguage } from './types';

/**
 * ISA — Minuteurs, alarmes et rappels
 * ===================================
 * Siri-like : l'assistant peut déclencher une alerte à une heure précise ou
 * après un délai, même onglet fermé — tant que la page est ouverte, via
 * `localStorage` + notifications du navigateur + son.
 *
 * Les tâches sont persistées : un rechargement de page ne perd pas une alarme.
 * Pour un usage téléphone réel (écran verrouillé), le serveur local expose la
 * même logique côté SMS/WhatsApp (voir `voice-ai/app/gateway.py`).
 */

export type ScheduleKind = 'timer' | 'alarm' | 'reminder';

export interface ScheduledTask {
  id: string;
  kind: ScheduleKind;
  /** Échéance en millisecondes (epoch). */
  fireAt: number;
  label?: string;
  language: VoiceLanguage;
  done: boolean;
  createdAt: number;
}

const STORAGE_KEY = 'isa-schedule-v1';

/** Fuseau officiel du Niger (GMT+1, sans changement d'heure). */
const NIAMEY_TIMEZONE = 'Africa/Niamey';

export function isNotificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch {
    return false;
  }
}

export function loadTasks(): ScheduledTask[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item: any) => item && typeof item.fireAt === 'number' && typeof item.kind === 'string')
      .map((item: any) => ({
        id: String(item.id || `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`),
        kind: item.kind as ScheduleKind,
        fireAt: Number(item.fireAt),
        label: item.label ? String(item.label) : undefined,
        language: (item.language as VoiceLanguage) || 'fr',
        done: Boolean(item.done),
        createdAt: Number(item.createdAt || Date.now()),
      }))
      .slice(-80);
  } catch {
    return [];
  }
}

export function saveTasks(tasks: ScheduledTask[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.slice(-80)));
  } catch {
    /* stockage indisponible : les tâches restent en mémoire */
  }
}

/**
 * Lit les composantes d'une date dans le fuseau de Niamey.
 *
 * On évite `new Date(date.toLocaleString(...))` : le format français
 * (« 30/10/2026 14:23:45 ») n'est pas analysable de façon fiable par V8 et
 * produisait des `Invalid Date`. `formatToParts` est explicite et stable.
 */
function niameyParts(now: Date): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: NIAMEY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const get = (type: string, fallback = 0): number => {
    const found = parts.find((part) => part.type === type);
    const value = Number(found?.value);
    return Number.isFinite(value) ? value : fallback;
  };

  // minuit peut être renvoyé comme « 24 » par certaines implémentations.
  const hour = get('hour') % 24;
  return { year: get('year', 1970), month: get('month', 1), day: get('day', 1), hour, minute: get('minute'), second: get('second') };
}

/** Décalage de Niamey par rapport à UTC, en millisecondes (toujours +1 h). */
function niameyOffsetMs(now: Date): number {
  const parts = niameyParts(now);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - now.getTime();
}

/** Calcule l'échéance d'une alarme « HH:MM » dans le fuseau de Niamey. */
export function nextOccurrence(clockTime: string, now = new Date()): number {
  const [hour, minute] = String(clockTime || '06:00')
    .split(':')
    .map((value) => Number(value));
  const safeHour = Number.isFinite(hour) ? Math.min(23, Math.max(0, hour)) : 6;
  const safeMinute = Number.isFinite(minute) ? Math.min(59, Math.max(0, minute)) : 0;

  // Le navigateur peut être dans un autre fuseau (utilisateur en voyage,
  // serveur à Paris) : « 6h30 » doit signifier 6h30 AU NIGER.
  const parts = niameyParts(now);
  const offset = niameyOffsetMs(now);

  let targetUtc = Date.UTC(parts.year, parts.month - 1, parts.day, safeHour, safeMinute, 0) - offset;
  if (targetUtc <= now.getTime()) {
    targetUtc += 24 * 60 * 60 * 1000;
  }
  return targetUtc;
}

export function addTask(task: Omit<ScheduledTask, 'id' | 'done' | 'createdAt'>): ScheduledTask {
  const created: ScheduledTask = {
    ...task,
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    done: false,
    createdAt: Date.now(),
  };
  const tasks = loadTasks();
  tasks.push(created);
  saveTasks(tasks);
  return created;
}

export function removeTask(id: string): void {
  saveTasks(loadTasks().filter((task) => task.id !== id));
}

export function pendingTasks(): ScheduledTask[] {
  return loadTasks()
    .filter((task) => !task.done && task.fireAt > Date.now() - 60000)
    .sort((a, b) => a.fireAt - b.fireAt);
}

/** Bip court synthétisé (aucun fichier audio à télécharger). */
export function playChime(): void {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const context = new Ctx();
    const notes = [880, 1174.66, 1567.98];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      const start = context.currentTime + index * 0.16;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.42);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.45);
    });
    window.setTimeout(() => void context.close().catch(() => undefined), 1600);
  } catch {
    /* audio indisponible : la notification visuelle suffit */
  }
}

export function notifyTask(task: ScheduledTask): void {
  const title =
    task.kind === 'timer'
      ? task.language === 'ha'
        ? 'Naƙila ta cika'
        : task.language === 'dje'
          ? 'Waati ben'
          : 'Minuteur terminé'
      : task.kind === 'alarm'
        ? task.language === 'ha'
          ? 'Agogo!'
          : task.language === 'dje'
            ? 'Alarme!'
            : 'Alarme !'
        : task.language === 'ha'
          ? 'Tunatarwa'
          : task.language === 'dje'
            ? 'Hongro'
            : 'Rappel';

  const body = task.label || new Date(task.fireAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  playChime();

  if (isNotificationsSupported() && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, tag: task.id, lang: task.language === 'ha' ? 'ha' : task.language === 'dje' ? 'dje' : 'fr' });
      return;
    } catch {
      /* certaines plateformes refusent Notification : repli sur l'événement */
    }
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('isa-task-fired', { detail: { task, title, body } }));
  }
}

/**
 * Boucle de vérification. À appeler une seule fois depuis le fournisseur de
 * contexte : elle réveille les tâches arrivées à échéance et relance celles qui
 * ont mûri pendant que l'onglet était en veille.
 */
export function startScheduler(onFire: (task: ScheduledTask) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  let timer = window.setInterval(() => {
    const now = Date.now();
    const tasks = loadTasks();
    let changed = false;
    tasks.forEach((task) => {
      if (task.done || task.fireAt > now) return;
      task.done = true;
      changed = true;
      notifyTask(task);
      onFire(task);
    });
    if (changed) saveTasks(tasks);
  }, 1000);

  const wakeUp = () => {
    const now = Date.now();
    const tasks = loadTasks();
    let changed = false;
    tasks.forEach((task) => {
      if (task.done || task.fireAt > now) return;
      task.done = true;
      changed = true;
      notifyTask(task);
      onFire(task);
    });
    if (changed) saveTasks(tasks);
  };

  window.addEventListener('focus', wakeUp);
  document.addEventListener('visibilitychange', wakeUp);

  return () => {
    window.clearInterval(timer);
    window.removeEventListener('focus', wakeUp);
    document.removeEventListener('visibilitychange', wakeUp);
  };
}

/** Format humain d'une échéance, dans la langue de l'utilisateur. */
export function describeTask(task: ScheduledTask): string {
  const time = new Date(task.fireAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Niamey' });
  if (task.language === 'ha') {
    return task.kind === 'timer' ? `Naƙila · ${time}` : task.kind === 'alarm' ? `Agogo · ${time}` : `Tunatarwa · ${time}`;
  }
  if (task.language === 'dje') {
    return task.kind === 'timer' ? `Waati · ${time}` : task.kind === 'alarm' ? `Alarme · ${time}` : `Hongro · ${time}`;
  }
  return task.kind === 'timer' ? `Minuteur · ${time}` : task.kind === 'alarm' ? `Alarme · ${time}` : `Rappel · ${time}`;
}
