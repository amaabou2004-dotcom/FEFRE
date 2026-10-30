import { handleVoiceThink } from '../../server/voiceService';

/**
 * ISA — Fonction Netlify : cerveau de l'assistant vocal.
 * Règles locales d'abord (hors-ligne), puis modèle de langage.
 * Chemin publié : `/.netlify/functions/voice-think` → `/api/voice/think`.
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
    const result = await handleVoiceThink({
      text: String(body?.text || ''),
      language: body?.language ? String(body.language) : undefined,
      context: body?.context,
      systemPrompt: body?.systemPrompt ? String(body.systemPrompt) : undefined,
      history: body?.history,
      clientIp: req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    });
    return jsonResponse(result.status, result.body);
  } catch (error) {
    console.error('[ISA voice] Netlify think invalide', error);
    return jsonResponse(400, { error: 'Demande invalide.', language: 'fr' });
  }
};
