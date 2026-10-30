import { handleVoiceStt } from '../../server/voiceService';

/**
 * ISA — Fonction Netlify : reconnaissance vocale (audio base64 → texte).
 * Chemin publié : `/.netlify/functions/voice-stt`, réécrit vers
 * `/api/voice/stt` par `netlify.toml`.
 */

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return jsonResponse(405, { error: 'Méthode non autorisée' });

  try {
    const body = (await req.json()) as Record<string, any>;
    const result = await handleVoiceStt({
      audioBase64: String(body?.audioBase64 || ''),
      mimeType: String(body?.mimeType || 'audio/wav'),
      language: String(body?.language || 'fr'),
    });
    return jsonResponse(result.status, result.body);
  } catch (error) {
    console.error('[ISA voice] Netlify STT invalide', error);
    return jsonResponse(400, { error: 'Audio invalide.', language: 'fr' });
  }
};
