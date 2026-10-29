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
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Gesture state tracking
  const touchState = useRef<{
    startX: number;
    startY: number;
    startScrollLeft: number;
    lastX: number;
    lastTime: number;
    velocity: number;
    isLockedVertical: boolean;
    isLockedHorizontal: boolean;
  }>({
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    isLockedVertical: false,
    isLockedHorizontal: false,
  });

  const checkScrollState = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    checkScrollState();
    el.addEventListener('scroll', checkScrollState, { passive: true });
    window.addEventListener('resize', checkScrollState);

    // Gestures handling with passive / active coordination:
    // When a touch gesture starts, we wait until the user moves a few pixels
    // to distinguish horizontal intent from vertical page scrolling intent.
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const state = touchState.current;

      state.startX = touch.clientX;
      state.startY = touch.clientY;
      state.lastX = touch.clientX;
      state.lastTime = performance.now();
      state.startScrollLeft = el.scrollLeft;
      state.velocity = 0;
      state.isLockedVertical = false;
      state.isLockedHorizontal = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const state = touchState.current;

      // If already identified as a vertical scroll, do NOT touch horizontal position at all!
      if (state.isLockedVertical) {
        return;
      }

      const deltaX = touch.clientX - state.startX;
      const deltaY = touch.clientY - state.startY;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Threshold before locking direction
      if (!state.isLockedHorizontal && !state.isLockedVertical) {
        if (absY > 7 && absY >= absX) {
          // Vertical movement detected first: Lock vertical!
          // The page will scroll smoothly and naturally without horizontal jitter.
          state.isLockedVertical = true;
          return;
        }

        if (absX > 8 && absX > absY * 1.2) {
          // Explicit horizontal gesture detected! Lock horizontal.
          state.isLockedHorizontal = true;
        } else {
          return;
        }
      }

      if (state.isLockedHorizontal) {
        // Prevent vertical bounce while horizontally swiping the carousel
        if (e.cancelable) {
          e.preventDefault();
        }

        const now = performance.now();
        const dt = Math.max(now - state.lastTime, 1);
        const dx = touch.clientX - state.lastX;
        state.velocity = dx / dt;
        state.lastX = touch.clientX;
        state.lastTime = now;

        // Directly move carousel without snap resistance while dragging
        el.scrollLeft = state.startScrollLeft - deltaX;
      }
    };

    const onTouchEnd = () => {
      const state = touchState.current;

      if (state.isLockedHorizontal) {
        // Momentum / inertia calculation when user releases finger
        const momentum = state.velocity * -150;
        if (Math.abs(momentum) > 30) {
          el.scrollBy({
            left: momentum,
            behavior: 'smooth',
          });
        }
      }

      state.isLockedVertical = false;
      state.isLockedHorizontal = false;
      checkScrollState();
    };

    // { passive: false } allows preventDefault() strictly when user is swiping horizontally
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('scroll', checkScrollState);
      window.removeEventListener('resize', checkScrollState);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [checkScrollState, children]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;
    const scrollAmount = Math.max(el.clientWidth * 0.75, 280);
    el.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className={`relative group/carousel w-full max-w-full overflow-x-clip ${className}`}>
      {/* Discrete Desktop Controls Header */}
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
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
              canScrollLeft
                ? 'bg-white dark:bg-[#0A2254] text-[#01184C] dark:text-[#D4AF37] border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37] hover:bg-[#F8FAFD] shadow-sm hover:scale-105 active:scale-95'
                : 'opacity-25 cursor-not-allowed bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            disabled={!canScrollRight}
            aria-label="Faire défiler vers la droite"
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
              canScrollRight
                ? 'bg-white dark:bg-[#0A2254] text-[#01184C] dark:text-[#D4AF37] border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37] hover:bg-[#F8FAFD] shadow-sm hover:scale-105 active:scale-95'
                : 'opacity-25 cursor-not-allowed bg-slate-100 dark:bg-white/5 text-slate-400 border-transparent'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Horizontal Scrollable Container */}
      <div
        ref={containerRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        style={{
          touchAction: 'pan-y',
          overscrollBehaviorX: 'contain',
          overscrollBehaviorY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
        className="carousel-track no-scrollbar flex items-stretch gap-4 sm:gap-6 overflow-x-auto overscroll-x-contain py-2 px-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 rounded-2xl"
      >
        {children}
      </div>

      {/* Mobile Swipe Hint (shows only if scrollable on touch devices) */}
      <div className="flex sm:hidden items-center justify-between mt-2 px-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
        <span>Glisser pour explorer</span>
        <span className="text-[#D4AF37] font-bold">→</span>
      </div>
    </div>
  );
};
