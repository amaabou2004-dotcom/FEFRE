import React, { useState } from 'react';
import { getOptimizedImageUrl, ImageOptimizationOptions } from '../lib/imageOptimization';

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  webpSrc?: string;
  mobileSrc?: string;
  srcSet?: string;
  sizes?: string;
  transform?: ImageOptimizationOptions;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  width?: number | string;
  height?: number | string;
}

/**
 * High-performance responsive image component serving WebP formats with fallback,
 * responsive srcset/sizes, lazy loading, and explicit dimensions to prevent CLS.
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc,
  webpSrc,
  mobileSrc,
  srcSet,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px',
  transform,
  priority = false,
  className = '',
  containerClassName = '',
  width,
  height,
  onError,
  onLoad,
  ...restProps
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Compute WebP source and standard source
  let resolvedWebp = webpSrc;
  let resolvedMain = src;

  // If transformation options are provided, route through the optimization endpoint
  if (transform) {
    resolvedWebp = getOptimizedImageUrl(src, { ...transform, format: 'webp' });
    resolvedMain = resolvedWebp;
  } else if (!resolvedWebp && (src.endsWith('.jpg') || src.endsWith('.jpeg') || src.endsWith('.png'))) {
    // Attempt automatic WebP sibling
    resolvedWebp = src.replace(/\.(jpg|jpeg|png)$/, '.webp');
  }

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!hasError && (fallbackSrc || resolvedMain !== src)) {
      setHasError(true);
      if (fallbackSrc) {
        (e.currentTarget as HTMLImageElement).src = fallbackSrc;
      }
    }
    if (onError) onError(e);
  };

  const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  // If mobileSrc is provided and no custom srcSet, build standard responsive srcSet
  const computedSrcSet = srcSet || (mobileSrc ? `${mobileSrc} 480w, ${resolvedMain} 960w` : undefined);

  return (
    <picture className={`inline-block ${containerClassName}`}>
      {/* Mobile-specific WebP when provided */}
      {mobileSrc && !hasError && (
        <source media="(max-width: 640px)" srcSet={mobileSrc} type="image/webp" />
      )}
      {/* Standard WebP source for browsers with WebP support */}
      {resolvedWebp && !hasError && !mobileSrc && (
        <source type="image/webp" srcSet={resolvedWebp} />
      )}
      <img
        src={hasError && fallbackSrc ? fallbackSrc : resolvedMain}
        srcSet={computedSrcSet}
        sizes={computedSrcSet ? sizes : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        // @ts-ignore fetchPriority is a valid modern HTML attribute
        fetchpriority={priority ? 'high' : 'auto'}
        onLoad={handleImgLoad}
        onError={handleImgError}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-90'
        }`}
        {...restProps}
      />
    </picture>
  );
};
