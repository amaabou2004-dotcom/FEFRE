import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, ArrowRight } from 'lucide-react';
import { useSiteData } from '../lib/DataContext';

export const WhatsAppButton: React.FC = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const { settings } = useSiteData();
  const whatsappUrl = `https://wa.me/${settings.whatsappRaw}?text=${encodeURIComponent(settings.defaultWhatsAppMessage)}`;

  return (
    <aside
      aria-label="Assistance WhatsApp"
      className="fixed bottom-[calc(var(--mobile-bottom-nav-height)+0.75rem)] lg:bottom-6 right-3 sm:right-6 z-30 flex flex-col items-end max-w-[calc(100vw-1.5rem)] pointer-events-auto"
    >
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mb-2.5 w-68 sm:w-72 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-[#01184C] text-[#0E1D38] dark:text-white p-3.5 sm:p-4 shadow-2xl border border-slate-200 dark:border-[#D4AF37]/40 relative transition-colors"
          >
            <button
              onClick={() => setShowTooltip(false)}
              className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 cursor-pointer"
              aria-label="Fermer l'info-bulle"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#01184C] dark:text-[#D4AF37]">
                Support Direct
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-200 leading-relaxed mb-2.5">
              Besoin d'un échange rapide ? Discutez avec nos spécialistes à Niamey sur WhatsApp.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-sheen inline-flex items-center justify-between w-full text-xs font-extrabold bg-[#D4AF37] text-[#01184C] px-3 py-2 rounded-xl hover:bg-[#E5C358] transition-colors shadow cursor-pointer"
            >
              <span>Ouvrir WhatsApp</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="relative group">
        <a
          id="whatsapp-floating-button"
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onMouseEnter={() => setShowTooltip(true)}
          className="btn-sheen flex items-center gap-2 sm:gap-3 p-2.5 sm:px-4 sm:py-3 rounded-full bg-white/95 dark:bg-[#01184C]/95 backdrop-blur-md text-[#01184C] dark:text-white border border-slate-300 dark:border-[#D4AF37]/50 shadow-xl hover:border-[#D4AF37] transition-all duration-300 group hover:shadow-lg cursor-pointer"
          aria-label="Contacter Excellence Services SARL sur WhatsApp"
        >
          <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#D4AF37] text-[#01184C] shadow">
            <MessageSquare className="w-4 h-4 fill-current" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-white dark:border-[#01184C]" />
          </div>
          <div className="hidden md:flex flex-col text-left pr-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#01184C] dark:text-[#D4AF37]">
              WhatsApp Direct
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-white tracking-tight">
              {settings.whatsapp}
            </span>
          </div>
        </a>
      </motion.div>
    </aside>
  );
};
