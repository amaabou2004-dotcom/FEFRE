import { handleAIChatRequest } from '../../server/aiChat';

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Méthode non autorisée' });
  }

  try {
    const body = await req.json();
    const clientIp =
      req.headers.get('x-nf-client-connection-ip') ||
      req.headers.get('client-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      null;

    const result = await handleAIChatRequest(body, { clientIp });
    return jsonResponse(result.status, result.body);
  } catch (error) {
    console.error('[Excellence AI] Invalid Netlify chat request', error);
    return jsonResponse(400, {
      error: 'Demande invalide. Veuillez reformuler votre message.',
      language: 'fr',
    });
  }
};
