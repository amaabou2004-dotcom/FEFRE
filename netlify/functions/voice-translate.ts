import { handleVoiceTranslate } from '../../server/voiceService';

/**
 * ISA — Fonction Netlify : traduction français ↔ zarma ↔ haoussa.
 * Chemin publié : `/.netlify/functions/voice-translate` → `/api/voice/translate`.
 */

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export default async (req: Request): Promise<Response> => {
  try {
    let text = '';
    let target = 'fr';
    let source = 'auto';

    if (req.method === 'POST') {
      const body = (await req.json()) as Record<string, any>;
      text = String(body?.text || '');
      target = String(body?.target || 'fr');
      source = String(body?.source || 'auto');
    } else {
      const url = new URL(req.url);
      text = url.searchParams.get('text') || '';
      target = url.searchParams.get('target') || 'fr';
      source = url.searchParams.get('source') || 'auto';
    }

    if (!text) return jsonResponse(400, { error: 'Texte manquant.' });

    const result = await handleVoiceTranslate({ text, target, source });
    return jsonResponse(result.status, result.body);
  } catch (error) {
    console.error('[ISA voice] Netlify translate invalide', error);
    return jsonResponse(400, { error: 'Demande invalide.' });
  }
};
