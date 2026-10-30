import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalCarouselProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  showControls?: boolean;
  showHint?: boolean;
}

export const HorizontalCarousel: React.FC<HorizontalCarouselProps> = ({
  children,
  className = '',
  ariaLabel = 'Carrousel horizontal',
  showControls = true,
  showHint = true,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollState = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      const element = containerRef.current;
      if (!element) return;
      const { scrollLeft, scrollWidth, clientWidth } = element;
      setCanScrollLeft(scrollLeft > 8);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
    });
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    checkScrollState();
    element.addEventListener('scroll', checkScrollState, { passive: true });
    window.addEventListener('resize', checkScrollState);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(checkScrollState);
      resizeObserver.observe(element);
      Array.from(element.children).forEach((child) => resizeObserver?.observe(child));
    }

    return () => {
      element.removeEventListener('scroll', checkScrollState);
      window.removeEventListener('resize', checkScrollState);
      resizeObserver?.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [checkScrollState, children]);

  const handleScroll = (direction: 'left' | 'right') => {
    const element = containerRef.current;
    if (!element) return;
    const scrollAmount = Math.max(element.clientWidth * 0.75, 280);
    element.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className={`relative group/carousel w-full max-w-full overflow-x-clip ${className}`}>
      {showControls && (
        <div className="flex items-center justify-end gap-2 mb-3 px-1">
          {showHint && (
            <span className="hidden sm:inline-block text-[11px] font-medium text-slate-400 dark:text-slate-500 mr-2 select-none">
              Faites défiler horizontalement
            </span>
          )}
          <button
            type="button"
            onClick={() => handleScroll('left')}
            disabled={!canScrollLeft}
            aria-label="Faire défiler vers la gauche"
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
              canScrollLeft
                ? 'bg-white dark:bg-[#0A2254] text-[#01184C] dark:text-[#D4AF37] border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37] hover:bg-[#F8FAFD] shadow-sm hover:scale-105 active:scale-95'
                : 'opacity-25 cursor-not-allowed bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent'
            }`}
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Faire défiler vers la droite"
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
              canScrollRight
                ? 'bg-white dark:bg-[#0A2254] text-[#01184C] dark:text-[#D4AF37] border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37] hover:bg-[#F8FAFD] shadow-sm hover:scale-105 active:scale-95'
                : 'opacity-25 cursor-not-allowed bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent'
            }`}
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/*
        Défilement 100 % natif : le navigateur choisit lui-même l'axe du geste,
        ce qui évite les blocages diagonaux et les saccades sur téléphone.
      */}
      <div
        ref={containerRef}
        role="region"
        aria-roledescription="carrousel"
        aria-label={ariaLabel}
        tabIndex={0}
        className="carousel-track no-scrollbar flex snap-x snap-proximity items-stretch gap-4 sm:gap-6 overflow-x-auto overscroll-x-contain scroll-pl-1 py-2 px-1 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 [&>*]:snap-start"
      >
        {children}
      </div>

      {showHint && (canScrollLeft || canScrollRight) && (
        <div className="flex sm:hidden items-center justify-between mt-2 px-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          <span>Glisser pour explorer</span>
          <span className="text-[#D4AF37] font-bold" aria-hidden="true">
            {canScrollRight ? '→' : '←'}
          </span>
        </div>
      )}
    </div>
  );
};
