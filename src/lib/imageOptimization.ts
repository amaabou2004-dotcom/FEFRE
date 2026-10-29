/**
 * Image Optimization & WebP Transformation Utilities
 * Excellence Services SARL
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  fit?: 'cover' | 'contain' | 'inside' | 'fill';
}

/**
 * Returns a dynamically optimized WebP URL served via the backend transformation pipeline
 */
export function getOptimizedImageUrl(
  src: string,
  options: ImageOptimizationOptions = {}
): string {
  if (!src) return '';
  // Data URLs, SVGs or blob URLs don't need server transformation
  if (src.startsWith('data:') || src.startsWith('blob:') || src.endsWith('.svg')) {
    return src;
  }

  const { width, height, quality = 82, format = 'webp', fit = 'cover' } = options;
  const params = new URLSearchParams();
  params.set('src', src);
  if (width) params.set('w', String(Math.round(width)));
  if (height) params.set('h', String(Math.round(height)));
  if (quality) params.set('q', String(Math.round(quality)));
  if (format) params.set('format', format);
  if (fit && fit !== 'cover') params.set('fit', fit);

  return `/api/images/transform?${params.toString()}`;
}

/**
 * Generates a responsive srcset string targeting multiple breakpoints with WebP
 */
export function getResponsiveWebpSrcSet(
  src: string,
  widths: number[] = [480, 768, 1024, 1440, 1920],
  quality = 82
): string {
  if (!src || src.startsWith('data:') || src.startsWith('blob:') || src.endsWith('.svg')) {
    return '';
  }

  return widths
    .map((w) => `${getOptimizedImageUrl(src, { width: w, quality, format: 'webp' })} ${w}w`)
    .join(', ');
}

// Cached browser WebP capability detection
let webpSupportedPromise: Promise<boolean> | null = null;

export function checkWebpSupport(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(true);

  if (webpSupportedPromise) return webpSupportedPromise;

  webpSupportedPromise = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve(img.width === 1 && img.height === 1);
    };
    img.onerror = () => {
      resolve(false);
    };
    // 1x1 pixel lossless WebP test string
    img.src = 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=';
  });

  return webpSupportedPromise;
}

/**
 * Transforms an image dataUrl or File directly to an optimized WebP string via backend or client canvas
 */
export async function convertToWebp(
  dataUrlOrFile: string | File,
  options: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<{ dataUrl: string; format: string; size: number; reductionPercentage?: number }> {
  const { maxWidth = 1600, maxHeight = 1600, quality = 82 } = options;

  let base64Data: string;

  if (typeof dataUrlOrFile === 'string') {
    base64Data = dataUrlOrFile;
  } else {
    // Read File to data URL
    base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(dataUrlOrFile);
    });
  }

  // Try server-side Sharp transformation first for precision
  try {
    const res = await fetch('/api/images/transform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataUrl: base64Data,
        width: maxWidth,
        height: maxHeight,
        quality,
        format: 'webp',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        dataUrl: data.dataUrl,
        format: 'webp',
        size: data.optimizedSize,
        reductionPercentage: data.reductionPercentage,
      };
    }
  } catch {
    // Fall back to client canvas WebP export
  }

  // Fallback to client-side HTML5 canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > maxWidth || h > maxHeight) {
        const ratio = Math.min(maxWidth / w, maxHeight / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context unavailable'));

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      // Export as webp (modern browsers fall back to png if unsupported)
      const webpUrl = canvas.toDataURL('image/webp', quality / 100);
      const estSize = Math.round((webpUrl.length * 3) / 4);

      resolve({
        dataUrl: webpUrl,
        format: webpUrl.startsWith('data:image/webp') ? 'webp' : 'jpeg',
        size: estSize,
      });
    };
    img.onerror = () => reject(new Error("Impossible de charger l'image pour la conversion"));
    img.src = base64Data;
  });
}
