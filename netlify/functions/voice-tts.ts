import { handleVoiceTts } from '../../server/voiceService';

/**
 * ISA — Fonction Netlify : synthèse vocale (texte → WAV base64).
 * Accepte GET (paramètres) et POST (JSON), pour rester utilisable depuis un
 * simple `new Audio(url)` comme depuis un appel `fetch`.
 * Chemin publié : `/.netlify/functions/voice-tts` → `/api/voice/tts`.
 */

function jsonResponse(status: number, body: Record<string, unknown>, cache = 'no-store'): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache },
  });
}

export default async (req: Request): Promise<Response> => {
  try {
    let text = '';
    let language = 'fr';
    let voice: string | undefined;

    if (req.method === 'POST') {
      const body = (await req.json()) as Record<string, any>;
      text = String(body?.text || '');
      language = String(body?.language || body?.lang || 'fr');
      voice = body?.voice ? String(body.voice) : undefined;
    } else {
      const url = new URL(req.url);
      text = url.searchParams.get('text') || '';
      language = url.searchParams.get('lang') || url.searchParams.get('language') || 'fr';
      voice = url.searchParams.get('voice') || undefined;
    }

    if (!text) return jsonResponse(400, { error: 'Texte manquant.' });

    const result = await handleVoiceTts({ text, language, voice });
    return jsonResponse(result.status, result.body, result.status === 200 ? 'public, max-age=300' : 'no-store');
  } catch (error) {
    console.error('[ISA voice] Netlify TTS invalide', error);
    return jsonResponse(400, { error: 'Demande invalide.' });
  }
};
