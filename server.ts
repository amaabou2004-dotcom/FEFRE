import express from 'express';
import path from 'path';
import fs from 'fs';
import compression from 'compression';
import { handleImageTransform, handleImageTransformPost } from './server/imageService';
import { handleAIChatRequest } from './server/aiChat';
import { handleVoiceStt, handleVoiceTts, handleVoiceThink, handleVoiceTranslate } from './server/voiceService';
import { searchGeo, searchNearby, getRoute, getWeather } from './server/geoService';

const app = express();
const PORT = process.env.PORT ? parseInt(String(process.env.PORT), 10) : 3000;

// Enable HTTP response compression (gzip / brotli) for all text, JS, CSS, JSON, HTML
app.use(
  compression({
    threshold: 1024,
  })
);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Direct download endpoints for cPanel LWS packages
app.get(['/download/cpanel', '/download/cpanel-public_html', '/download/excellence-services-cpanel-public_html.zip', '/downloads/excellence-services-cpanel-public_html.zip'], (req, res) => {
  const candidatePaths = [
    path.join(process.cwd(), 'cpanel-lws-export', 'excellence-services-cpanel-public_html.zip'),
    path.join(process.cwd(), 'public', 'downloads', 'excellence-services-cpanel-public_html.zip'),
    path.join(process.cwd(), 'dist', 'downloads', 'excellence-services-cpanel-public_html.zip'),
  ];
  const found = candidatePaths.find((p) => fs.existsSync(p));
  if (found) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="excellence-services-cpanel-public_html.zip"');
    return res.sendFile(found);
  }
  return res.status(404).send("Archive non trouvée. Veuillez exécuter 'npm run build:cpanel'.");
});

app.get(['/download/cpanel-nodejs', '/download/excellence-services-cpanel-nodejs.zip', '/downloads/excellence-services-cpanel-nodejs.zip'], (req, res) => {
  const candidatePaths = [
    path.join(process.cwd(), 'cpanel-lws-export', 'excellence-services-cpanel-nodejs.zip'),
    path.join(process.cwd(), 'public', 'downloads', 'excellence-services-cpanel-nodejs.zip'),
    path.join(process.cwd(), 'dist', 'downloads', 'excellence-services-cpanel-nodejs.zip'),
  ];
  const found = candidatePaths.find((p) => fs.existsSync(p));
  if (found) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="excellence-services-cpanel-nodejs.zip"');
    return res.sendFile(found);
  }
  return res.status(404).send("Archive Node.js non trouvée. Veuillez exécuter 'npm run build:cpanel'.");
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY),
  });
});

// Image Transformation and WebP Optimization Service
app.get('/api/images/transform', handleImageTransform);
app.get('/api/images/optimize', handleImageTransform);
app.post('/api/images/transform', handleImageTransformPost);
app.post('/api/images/optimize', handleImageTransformPost);

app.post('/api/ai/chat', async (req, res) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const clientIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0]?.trim() || req.ip;
  const result = await handleAIChatRequest(req.body, { clientIp });
  res.setHeader('Cache-Control', 'no-store');
  return res.status(result.status).json(result.body);
});

/* ------------------------------------------------------------------ */
/* ISA — Assistant vocal (voix, carte, météo)                          */
/* ------------------------------------------------------------------ */

function clientIpOf(req: any): string | null {
  const forwardedFor = req.headers?.['x-forwarded-for'];
  return (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(',')[0]?.trim()) || req.ip || null;
}

// Reconnaissance vocale : audio base64 (WAV 16 kHz) → texte.
app.post('/api/voice/stt', async (req, res) => {
  const body = req.body || {};
  let audioBase64 = typeof body.audioBase64 === 'string' ? body.audioBase64 : '';
  let mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'audio/wav';

  // Accepte aussi un envoi binaire brut (curl, kiosque, app Android).
  if (!audioBase64 && Buffer.isBuffer(req.body) && req.body.length) {
    audioBase64 = req.body.toString('base64');
    mimeType = String(req.headers['content-type'] || 'audio/wav');
  }

  const result = await handleVoiceStt({
    audioBase64,
    mimeType,
    language: typeof body.language === 'string' ? body.language : 'fr',
  });
  res.setHeader('Cache-Control', 'no-store');
  return res.status(result.status).json(result.body);
});

// Cerveau : texte → réponse + actions (règles locales puis LLM).
app.post('/api/voice/think', async (req, res) => {
  const body = req.body || {};
  const result = await handleVoiceThink({
    text: typeof body.text === 'string' ? body.text : '',
    language: typeof body.language === 'string' ? body.language : undefined,
    context: body.context,
    systemPrompt: typeof body.systemPrompt === 'string' ? body.systemPrompt : undefined,
    history: body.history,
    clientIp: clientIpOf(req),
  });
  res.setHeader('Cache-Control', 'no-store');
  return res.status(result.status).json(result.body);
});

// Synthèse vocale : texte → WAV (Piper/MMS local, sinon Gemini TTS).
app.all('/api/voice/tts', async (req, res) => {
  const source = req.method === 'POST' ? req.body || {} : req.query || {};
  const result = await handleVoiceTts({
    text: typeof source.text === 'string' ? source.text : String(source.text || ''),
    language: typeof source.language === 'string' ? source.language : String(source.lang || 'fr'),
    voice: typeof source.voice === 'string' ? source.voice : undefined,
  });
  res.setHeader('Cache-Control', result.status === 200 ? 'public, max-age=300' : 'no-store');
  return res.status(result.status).json(result.body);
});

// Traduction français ↔ zarma ↔ haoussa.
app.all('/api/voice/translate', async (req, res) => {
  const source = req.method === 'POST' ? req.body || {} : req.query || {};
  const result = await handleVoiceTranslate({
    text: String(source.text || ''),
    target: String(source.target || 'fr'),
    source: String(source.source || 'auto'),
  });
  res.setHeader('Cache-Control', 'no-store');
  return res.status(result.status).json(result.body);
});

/* Services géographiques gratuits (Nominatim / Overpass / OSRM / Open-Meteo) */

app.get('/api/geo/search', async (req, res) => {
  const q = String(req.query.q || '');
  const results = await searchGeo({
    q,
    lat: req.query.lat ? Number(req.query.lat) : undefined,
    lon: req.query.lon ? Number(req.query.lon) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : 5,
  });
  res.setHeader('Cache-Control', 'public, max-age=600');
  return res.json({ query: q, results });
});

app.get('/api/geo/nearby', async (req, res) => {
  const results = await searchNearby({
    category: String(req.query.category || ''),
    lat: req.query.lat !== undefined ? Number(req.query.lat) : undefined,
    lon: req.query.lon !== undefined ? Number(req.query.lon) : undefined,
    radius: req.query.radius ? Number(req.query.radius) : 4000,
    limit: req.query.limit ? Number(req.query.limit) : 6,
  });
  res.setHeader('Cache-Control', 'public, max-age=600');
  return res.json({ category: String(req.query.category || ''), results });
});

app.get('/api/geo/route', async (req, res) => {
  const [fromLat, fromLon] = String(req.query.from || '').split(',').map(Number);
  const [toLat, toLon] = String(req.query.to || '').split(',').map(Number);
  if (![fromLat, fromLon, toLat, toLon].every((value) => Number.isFinite(value))) {
    return res.status(400).json({ error: 'Paramètres from/to invalides (format lat,lon).' });
  }
  const route = await getRoute({
    from: { lat: fromLat, lon: fromLon },
    to: { lat: toLat, lon: toLon },
    mode: (String(req.query.mode || 'driving') as 'driving' | 'walking' | 'bicycling'),
  });
  if (!route) return res.status(502).json({ error: 'Itinéraire indisponible pour le moment.' });
  res.setHeader('Cache-Control', 'public, max-age=1800');
  return res.json(route);
});

app.get('/api/geo/weather', async (req, res) => {
  const weather = await getWeather(String(req.query.city || 'Niamey'));
  if (!weather) return res.status(502).json({ error: 'Météo indisponible pour le moment.' });
  res.setHeader('Cache-Control', 'public, max-age=900');
  return res.json(weather);
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Chargement dynamique : le package Node.js de production (cPanel LWS)
    // n'a ainsi pas besoin d'installer Vite, qui ne sert qu'en développement.
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(
      express.static(distPath, {
        maxAge: '1y',
        immutable: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            // HTML should always revalidate so users instantly receive new releases
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
          } else if (/\.(js|css|webp|png|jpg|jpeg|svg|woff2|ico)$/i.test(filePath)) {
            // Hashed JS, CSS, and optimized images can be cached for 1 year
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );
    app.get('*all', (req, res) => {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
