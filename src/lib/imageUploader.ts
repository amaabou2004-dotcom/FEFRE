export interface CompressedImageResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  filename: string;
  reductionPercentage: number;
}

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Ko';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) return { valid: false, error: 'Aucun fichier sélectionné.' };
  const validTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/svg+xml',
    'image/gif'
  ];
  if (!validTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Format non supporté. Veuillez utiliser un format JPG, PNG, WebP ou SVG.'
    };
  }
  const maxSize = 25 * 1024 * 1024; // 25 MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Fichier trop volumineux (${formatBytes(file.size)}). La limite maximale est de 25 Mo.`
    };
  }
  return { valid: true };
}

export function compressAndEncodeImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return reject(new Error(validation.error));
    }

    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        resolve({
          dataUrl,
          originalSize: file.size,
          compressedSize: file.size,
          width: 800,
          height: 800,
          filename: file.name,
          reductionPercentage: 0,
        });
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier SVG.'));
      reader.readAsDataURL(file);
      return;
    }

    const {
      maxWidth = 1600,
      maxHeight = 1600,
      quality = 0.82,
      format = 'image/webp',
    } = options;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Impossible d’initialiser le moteur de compression d’image.'));
        }

        if (format === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        let q = quality;
        let targetFormat = format;
        let dataUrl = canvas.toDataURL(targetFormat, q);

        // If WebP is requested but unsupported by older browser, fallback to jpeg
        if (targetFormat === 'image/webp' && !dataUrl.startsWith('data:image/webp')) {
          targetFormat = 'image/jpeg';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          dataUrl = canvas.toDataURL(targetFormat, q);
        }

        let compressedSize = Math.round((dataUrl.length * 3) / 4);

        if (compressedSize > 400 * 1024 && q > 0.6) {
          q = 0.72;
          dataUrl = canvas.toDataURL(targetFormat, q);
          compressedSize = Math.round((dataUrl.length * 3) / 4);
        }

        const reductionPercentage = Math.max(0, Math.round(((file.size - compressedSize) / file.size) * 100));

        resolve({
          dataUrl,
          originalSize: file.size,
          compressedSize,
          width,
          height,
          filename: file.name,
          reductionPercentage,
        });
      };

      img.onerror = () => reject(new Error('Échec du décodage de l\'image. Le fichier est peut-être corrompu.'));
    };

    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier.'));
  });
}

export async function downloadImageFile(url: string, filename = 'image-excellence-services.jpg') {
  if (!url) throw new Error('Aucune URL d’image fournie pour le téléchargement.');
  const targetFilename = filename.endsWith('.jpg') || filename.endsWith('.png') || filename.endsWith('.webp')
    ? filename
    : `${filename}.jpg`;

  try {
    if (url.startsWith('data:')) {
      const a = document.createElement('a');
      a.href = url;
      a.download = targetFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = targetFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (err) {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = targetFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
