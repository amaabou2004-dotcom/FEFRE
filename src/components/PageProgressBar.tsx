import React, { useEffect, useState } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import { useRouter } from '../lib/router';

export const PageProgressBar: React.FC = () => {
  const { currentPath } = useRouter();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const [isNavigating, setIsNavigating] = useState(false);

  // Micro flash bar on route change for instantaneous visual feedback
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [currentPath]);

  return (
    <>
      {/* Route change loader bar */}
      {isNavigating && (
        <motion.div
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 0.8 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeInOut' }}
          className="fixed top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#D4AF37] via-[#F4E3A1] to-[#D4AF37] origin-left z-[100] shadow-[0_0_8px_rgba(212,175,55,0.7)] pointer-events-none"
        />
      )}

      {/* Reading scroll progress bar for long pages */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-[2px] bg-[#D4AF37] origin-left z-[90] pointer-events-none opacity-80"
      />
    </>
  );
};
