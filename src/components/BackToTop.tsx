import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp } from 'lucide-react';

export const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={scrollToTop}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2 }}
          aria-label="Retour en haut de page"
          title="Retour en haut"
          className="fixed bottom-20 sm:bottom-24 right-3 sm:right-6 z-35 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 dark:bg-[#0A2254]/95 backdrop-blur-md text-[#01184C] dark:text-[#D4AF37] border border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37] shadow-lg flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
