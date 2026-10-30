import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';

interface HorizontalCarouselProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  showControls?: boolean;
  showHint?: boolean;
  /** Active le défilement automatique doux (aller-retour) quand le carrousel est visible. */
  autoScroll?: boolean;
  /** Vitesse du défilement automatique, en pixels par seconde. */
  autoScrollSpeed?: number;
  /** Sens initial du défilement automatique. */
  autoScrollDirection?: 'forward' | 'reverse';
  /** Délai avant reprise après une interaction manuelle, en millisecondes. */
  autoScrollResumeDelay?: number;
}

export const HorizontalCarousel: React.FC<HorizontalCarouselProps> = ({
  children,
  className = '',
  ariaLabel = 'Carrousel horizontal',
  showControls = true,
  showHint = true,
  autoScroll = false,
  autoScrollSpeed = 34,
  autoScrollDirection = 'forward',
  autoScrollResumeDelay = 2800,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const pauseReasonsRef = useRef<Set<string>>(new Set());
  const resumeAtRef = useRef(0);
  const directionRef = useRef<1 | -1>(autoScrollDirection === 'reverse' ? -1 : 1);
  const expectedScrollLeftRef = useRef<number | null>(null);
  const reverseInitializedRef = useRef(false);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const autoplayActive = autoScroll && !userPaused && !prefersReducedMotion;

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

  const handleScrollEvent = useCallback(() => {
    const element = containerRef.current;
    if (element && expectedScrollLeftRef.current !== null) {
      const distanceFromAutoplay = Math.abs(element.scrollLeft - expectedScrollLeftRef.current);
      // Un écart important signifie que l'utilisateur fait défiler lui-même :
      // on lui laisse la main avant de reprendre l'animation.
      if (distanceFromAutoplay > 4) {
        resumeAtRef.current = performance.now() + autoScrollResumeDelay;
        expectedScrollLeftRef.current = element.scrollLeft;
      }
    }
    checkScrollState();
  }, [autoScrollResumeDelay, checkScrollState]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    checkScrollState();
    element.addEventListener('scroll', handleScrollEvent, { passive: true });
    window.addEventListener('resize', checkScrollState);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(checkScrollState);
      resizeObserver.observe(element);
      Array.from(element.children).forEach((child) => resizeObserver?.observe(child));
    }

    let intersectionObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          setIsInView(entries.some((entry) => entry.isIntersecting));
        },
        { threshold: 0.18 },
      );
      intersectionObserver.observe(element);
    } else {
      setIsInView(true);
    }

    return () => {
      element.removeEventListener('scroll', handleScrollEvent);
      window.removeEventListener('resize', checkScrollState);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [checkScrollState, handleScrollEvent, children]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  /**
   * Défilement automatique en aller-retour.
   * - Ne tourne que si le carrousel est visible et l'onglet actif.
   * - Se met en pause dès que l'utilisateur survole, touche ou navigue au clavier.
   * - Utilise scrollLeft : les cartes restent de vrais liens/boutons cliquables.
   */
  useEffect(() => {
    if (!autoplayActive || !isInView) return;
    const element = containerRef.current;
    if (!element) return;

    directionRef.current = autoScrollDirection === 'reverse' ? -1 : 1;

    const initialMaxScroll = element.scrollWidth - element.clientWidth;
    if (
      autoScrollDirection === 'reverse' &&
      !reverseInitializedRef.current &&
      initialMaxScroll > 1 &&
      element.scrollLeft <= 1
    ) {
      element.scrollLeft = initialMaxScroll;
      expectedScrollLeftRef.current = initialMaxScroll;
    }
    reverseInitializedRef.current = true;
    expectedScrollLeftRef.current = element.scrollLeft;

    let animationFrame = 0;
    let lastTimestamp = performance.now();

    const step = (timestamp: number) => {
      const deltaSeconds = Math.min((timestamp - lastTimestamp) / 1000, 0.05);
      lastTimestamp = timestamp;

      const maxScroll = element.scrollWidth - element.clientWidth;
      const temporarilyPaused =
        document.hidden || pauseReasonsRef.current.size > 0 || timestamp < resumeAtRef.current;

      if (!temporarilyPaused && maxScroll > 1 && deltaSeconds > 0) {
        let nextScrollLeft =
          element.scrollLeft + directionRef.current * autoScrollSpeed * deltaSeconds;

        if (nextScrollLeft >= maxScroll) {
          nextScrollLeft = maxScroll;
          directionRef.current = -1;
          resumeAtRef.current = timestamp + 900;
        } else if (nextScrollLeft <= 0) {
          nextScrollLeft = 0;
          directionRef.current = 1;
          resumeAtRef.current = timestamp + 900;
        }

        expectedScrollLeftRef.current = nextScrollLeft;
        element.scrollLeft = nextScrollLeft;
      }

      animationFrame = window.requestAnimationFrame(step);
    };

    animationFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [autoplayActive, autoScrollDirection, autoScrollSpeed, isInView]);

  const setTemporaryPause = (reason: string, active: boolean) => {
    if (active) {
      pauseReasonsRef.current.add(reason);
    } else if (pauseReasonsRef.current.delete(reason)) {
      resumeAtRef.current = performance.now() + autoScrollResumeDelay;
    }
  };

  const delayAutoplay = () => {
    resumeAtRef.current = performance.now() + autoScrollResumeDelay;
  };

  /* Libère la pause tactile même si le doigt est relâché hors du carrousel. */
  useEffect(() => {
    const clearPointerPause = () => {
      if (pauseReasonsRef.current.delete('pointer')) {
        resumeAtRef.current = performance.now() + autoScrollResumeDelay;
      }
    };
    window.addEventListener('pointerup', clearPointerPause, { passive: true });
    window.addEventListener('pointercancel', clearPointerPause, { passive: true });
    return () => {
      window.removeEventListener('pointerup', clearPointerPause);
      window.removeEventListener('pointercancel', clearPointerPause);
    };
  }, [autoScrollResumeDelay]);

  const toggleAutoplay = () => {
    if (prefersReducedMotion) return;
    setUserPaused((paused) => {
      if (paused) {
        // Reprise explicite : ne pas rester bloqué par le focus du bouton lui-même.
        pauseReasonsRef.current.delete('focus');
        resumeAtRef.current = 0;
        expectedScrollLeftRef.current = containerRef.current?.scrollLeft ?? null;
      }
      return !paused;
    });
  };

  const handleScroll = (direction: 'left' | 'right') => {
    const element = containerRef.current;
    if (!element) return;
    directionRef.current = direction === 'left' ? -1 : 1;
    delayAutoplay();
    const scrollAmount = Math.max(element.clientWidth * 0.75, 280);
    element.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleFocusCapture = (event: React.FocusEvent<HTMLDivElement>) => {
    // Pause uniquement pour la navigation clavier, pas pour un simple clic souris.
    if (event.target instanceof HTMLElement && event.target.matches(':focus-visible')) {
      setTemporaryPause('focus', true);
    }
  };

  const handleBlurCapture = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setTemporaryPause('focus', false);
    }
  };

  return (
    <div
      className={`relative group/carousel w-full max-w-full overflow-x-clip ${className}`}
      onMouseEnter={() => {
        if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
          setTemporaryPause('hover', true);
        }
      }}
      onMouseLeave={() => setTemporaryPause('hover', false)}
      onPointerDown={() => setTemporaryPause('pointer', true)}
      onPointerUp={() => setTemporaryPause('pointer', false)}
      onPointerCancel={() => setTemporaryPause('pointer', false)}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
    >
      {showControls && (
        <div className="flex items-center justify-between gap-3 mb-3 px-1">
          <div className="flex min-h-10 items-center">
            {autoScroll && (
              <span className="inline-flex items-center gap-2 rounded-full border border-[#DDE4EE] dark:border-white/10 bg-white/80 dark:bg-[#0A2254]/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#01184C] dark:text-[#D4AF37]">
                <span
                  className={`h-1.5 w-1.5 rounded-full bg-[#D4AF37] ${
                    autoplayActive && isInView ? 'animate-pulse' : 'opacity-40'
                  }`}
                  aria-hidden="true"
                />
                Auto
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {showHint && (
              <span className="hidden sm:inline-block text-[11px] font-medium text-slate-400 dark:text-slate-500 mr-2 select-none">
                {autoScroll ? 'Défilement automatique' : 'Faites défiler horizontalement'}
              </span>
            )}

            {autoScroll && (
              <button
                type="button"
                onClick={toggleAutoplay}
                disabled={prefersReducedMotion}
                aria-label={
                  userPaused
                    ? 'Reprendre le défilement automatique'
                    : 'Mettre en pause le défilement automatique'
                }
                aria-pressed={!userPaused && !prefersReducedMotion}
                title={
                  prefersReducedMotion
                    ? 'Défilement automatique désactivé par vos préférences système'
                    : userPaused
                      ? 'Reprendre le défilement automatique'
                      : 'Mettre en pause le défilement automatique'
                }
                className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                  prefersReducedMotion
                    ? 'cursor-not-allowed border-transparent bg-slate-100 text-slate-400 opacity-40 dark:bg-white/5'
                    : 'cursor-pointer bg-white dark:bg-[#0A2254] text-[#01184C] dark:text-[#D4AF37] border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37] hover:bg-[#F8FAFD] shadow-sm hover:scale-105 active:scale-95'
                }`}
              >
                {userPaused || prefersReducedMotion ? (
                  <Play className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Pause className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
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
        </div>
      )}

      {/*
        Défilement tactile natif : le navigateur choisit l'axe du geste.
        Le snap est désactivé pendant l'auto-défilement pour un mouvement continu.
      */}
      <div
        ref={containerRef}
        role="region"
        aria-roledescription="carrousel"
        aria-label={ariaLabel}
        aria-live="off"
        data-auto-scroll={autoplayActive ? 'true' : 'false'}
        tabIndex={0}
        onWheel={delayAutoplay}
        onKeyDown={(event) => {
          if (['ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
            delayAutoplay();
          }
        }}
        className={`carousel-track no-scrollbar flex items-stretch gap-4 sm:gap-6 overflow-x-auto overscroll-x-contain scroll-pl-1 py-2 px-1 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 ${
          autoScroll ? 'snap-none' : 'snap-x snap-proximity [&>*]:snap-start'
        }`}
      >
        {children}
      </div>

      {showHint && (canScrollLeft || canScrollRight) && (
        <div className="flex sm:hidden items-center justify-between mt-2 px-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          <span>
            {autoScroll
              ? userPaused
                ? 'Défilement automatique en pause'
                : 'Défilement automatique — touchez pour explorer'
              : 'Glisser pour explorer'}
          </span>
          <span className="text-[#D4AF37] font-bold" aria-hidden="true">
            {canScrollRight ? '→' : '←'}
          </span>
        </div>
      )}
    </div>
  );
};
