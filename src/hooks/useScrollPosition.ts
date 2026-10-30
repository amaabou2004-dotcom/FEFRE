import { useState, useEffect, useRef } from 'react';

/**
 * Indique si la page a dépassé un seuil de défilement.
 *
 * Le calcul est limité à une fois par frame (requestAnimationFrame) et l'état
 * ne change qu'au franchissement du seuil : l'en-tête ne se re-rend donc pas
 * à chaque événement de scroll, ce qui garde le défilement fluide sur mobile.
 * Une petite hystérésis évite tout clignotement autour du seuil.
 */
export function useScrollPosition(threshold = 50) {
  const [isScrolled, setIsScrolled] = useState(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const update = () => {
      frameRef.current = null;
      const scrollY = window.scrollY;
      setIsScrolled((previous) =>
        previous ? scrollY > Math.max(threshold - 8, 0) : scrollY > threshold,
      );
    };

    const handleScroll = () => {
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [threshold]);

  return { isScrolled };
}
