import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import type { Request, Response } from 'express';
import sharp from 'sharp';

// Directory for persistent caching of transformed images
const CACHE_DIR = path.join(process.cwd(), '.cache', 'images');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export interface TransformQuery {
  src?: string;
  url?: string;
  w?: string | number;
  width?: string | number;
  h?: string | number;
  height?: string | number;
  q?: string | number;
  quality?: string | number;
  format?: string;
  fit?: 'cover' | 'contain' | 'inside' | 'fill';
}

/**
 * Resolves a local or relative image file path safely within project boundaries
 */
function resolveLocalImagePath(rawPath: string): string | null {
  if (!rawPath) return null;

  // Clean and decode path
  let clean = decodeURIComponent(rawPath).trim();
  // Strip leading query params if any
  clean = clean.split('?')[0];

  // Prevent path traversal outside application
  if (clean.includes('..')) {
    return null;
  }

  // Remove leading slashes
  const normalized = clean.replace(/^\/+/, '');
  const fileName = path.basename(normalized);

  // Search candidate locations in priority order
  const candidates = [
    // 1. Exact path relative to cwd
    path.join(process.cwd(), normalized),
    // 2. In public directory
    path.join(process.cwd(), 'public', normalized),
    // 3. In dist directory (production build)
    path.join(process.cwd(), 'dist', normalized),
    // 4. In dist/assets directory
    path.join(process.cwd(), 'dist', 'assets', fileName),
    // 5. In src/assets/images directory
    path.join(process.cwd(), 'src', 'assets', 'images', fileName),
    // 6. In root assets directory if any
    path.join(process.cwd(), 'assets', fileName),
  ];

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    } catch {
      // Continue to next candidate
    }
  }

  return null;
}

/**
 * Handles GET /api/images/transform
 * Dynamically resizes, compresses, and serves WebP formats on demand with HTTP caching
 */
export async function handleImageTransform(req: Request, res: Response): Promise<void> {
  try {
    const query = req.query as unknown as TransformQuery;
    const src = (query.src || query.url || '') as string;

    if (!src) {
      res.status(400).json({
        error: "Paramètre 'src' requis (ex: /api/images/transform?src=logo.png&w=400&format=webp)",
      });
      return;
    }

    // Determine target format (default: webp, or based on Accept header)
    const acceptHeader = req.headers.accept || '';
    const prefersWebp = acceptHeader.includes('image/webp');
    let format = (query.format || (prefersWebp ? 'webp' : 'webp')).toLowerCase();
    if (!['webp', 'png', 'jpeg', 'jpg', 'avif'].includes(format)) {
      format = 'webp';
    }
    if (format === 'jpg') format = 'jpeg';

    // Parse dimensions and quality
    const rawWidth = query.w || query.width;
    const rawHeight = query.h || query.height;
    const rawQuality = query.q || query.quality;

    const width = rawWidth ? Math.min(3840, Math.max(16, parseInt(String(rawWidth), 10))) : undefined;
    const height = rawHeight ? Math.min(3840, Math.max(16, parseInt(String(rawHeight), 10))) : undefined;
    const quality = rawQuality ? Math.min(100, Math.max(10, parseInt(String(rawQuality), 10))) : 82;
    const fit = (query.fit || 'cover') as 'cover' | 'contain' | 'inside' | 'fill';

    let inputBuffer: Buffer;
    let sourceMtime = 0;

    // Handle remote URL vs local file
    if (src.startsWith('http://') || src.startsWith('https://')) {
      // Fetch external image
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      try {
        const fetchRes = await fetch(src, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!fetchRes.ok) {
          res.status(404).json({ error: `Image distante inaccessible (${fetchRes.status})` });
          return;
        }
        const arrayBuf = await fetchRes.arrayBuffer();
        inputBuffer = Buffer.from(arrayBuf);
      } catch (err: any) {
        clearTimeout(timeoutId);
        res.status(502).json({ error: `Erreur lors de la récupération de l'image distante: ${err.message}` });
        return;
      }
    } else {
      // Local file
      const localPath = resolveLocalImagePath(src);
      if (!localPath) {
        res.status(404).json({ error: `Image locale introuvable: ${src}` });
        return;
      }
      const stat = fs.statSync(localPath);
      sourceMtime = stat.mtimeMs;
      inputBuffer = fs.readFileSync(localPath);
    }

    // Generate deterministic cache key
    const cacheKey = crypto
      .createHash('sha256')
      .update(`${src}|${sourceMtime}|${width || 'auto'}|${height || 'auto'}|${quality}|${format}|${fit}`)
      .digest('hex');

    const cacheFilePath = path.join(CACHE_DIR, `${cacheKey}.${format}`);
    const etag = `"${cacheKey}"`;

    // Check client ETag for HTTP 304 Not Modified
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }

    let outputBuffer: Buffer;

    if (fs.existsSync(cacheFilePath)) {
      outputBuffer = fs.readFileSync(cacheFilePath);
    } else {
      // Perform Sharp transformation
      let transformer = sharp(inputBuffer);

      // Apply resize if dimensions specified
      if (width || height) {
        transformer = transformer.resize({
          width,
          height,
          fit,
          withoutEnlargement: true,
        });
      }

      // Convert to requested format with high-efficiency settings
      if (format === 'webp') {
        transformer = transformer.webp({
          quality,
          effort: 4,
          smartSubsample: true,
        });
      } else if (format === 'avif') {
        transformer = transformer.avif({
          quality,
          effort: 4,
        });
      } else if (format === 'jpeg') {
        transformer = transformer.jpeg({
          quality,
          progressive: true,
          mozjpeg: true,
        });
      } else if (format === 'png') {
        transformer = transformer.png({
          compressionLevel: 8,
        });
      }

      outputBuffer = await transformer.toBuffer();

      // Write asynchronously to disk cache
      fs.writeFile(cacheFilePath, outputBuffer, () => {});
    }

    // Set high-performance caching and content type headers
    res.setHeader('Content-Type', `image/${format}`);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('ETag', etag);
    res.setHeader('Vary', 'Accept');
    res.setHeader('X-Image-Transform', 'optimized-webp');
    res.setHeader('Content-Length', outputBuffer.length);

    res.send(outputBuffer);
  } catch (err: any) {
    console.error('[ImageTransform Error]', err);
    res.status(500).json({ error: `Erreur d'optimisation d'image: ${err.message}` });
  }
}

/**
 * Handles POST /api/images/transform
 * Optimizes base64/data URLs directly to WebP for user uploads and media managers
 */
export async function handleImageTransformPost(req: Request, res: Response): Promise<void> {
  try {
    const { dataUrl, width, height, quality = 82, format = 'webp' } = req.body;

    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ error: "Champ 'dataUrl' requis." });
      return;
    }

    // Extract base64 payload
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let inputBuffer: Buffer;
    if (matches && matches.length === 3) {
      inputBuffer = Buffer.from(matches[2], 'base64');
    } else {
      inputBuffer = Buffer.from(dataUrl, 'base64');
    }

    let transformer = sharp(inputBuffer);

    if (width || height) {
      transformer = transformer.resize({
        width: width ? parseInt(String(width), 10) : undefined,
        height: height ? parseInt(String(height), 10) : undefined,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    const q = Math.min(100, Math.max(10, parseInt(String(quality), 10)));
    const targetFormat = format === 'jpeg' || format === 'jpg' ? 'jpeg' : 'webp';

    if (targetFormat === 'webp') {
      transformer = transformer.webp({ quality: q, effort: 4 });
    } else {
      transformer = transformer.jpeg({ quality: q, progressive: true });
    }

    const outputBuffer = await transformer.toBuffer();
    const metadata = await sharp(outputBuffer).metadata();

    const outputDataUrl = `data:image/${targetFormat};base64,${outputBuffer.toString('base64')}`;
    const originalSize = inputBuffer.length;
    const optimizedSize = outputBuffer.length;
    const reductionPercentage = Math.max(0, Math.round(((originalSize - optimizedSize) / originalSize) * 100));

    res.json({
      success: true,
      format: targetFormat,
      dataUrl: outputDataUrl,
      width: metadata.width,
      height: metadata.height,
      originalSize,
      optimizedSize,
      reductionPercentage,
      message: `Image convertie en ${targetFormat.toUpperCase()} optimisé (${Math.round(optimizedSize / 1024)} Ko, -${reductionPercentage}%).`,
    });
  } catch (err: any) {
    console.error('[ImageTransform POST Error]', err);
    res.status(500).json({ error: `Erreur de traitement: ${err.message}` });
  }
}
