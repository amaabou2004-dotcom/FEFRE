import express from 'express';
import path from 'path';
import fs from 'fs';
import compression from 'compression';
import { createServer as createViteServer } from 'vite';
import { handleImageTransform, handleImageTransformPost } from './server/imageService';
import { handleAIChatRequest } from './server/aiChat';

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

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
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
