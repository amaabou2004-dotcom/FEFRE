import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Newspaper,
  ArrowRight,
  Calendar,
  Clock,
  Sparkles,
  Building2,
  Tag,
  X,
  Share2,
  Check,
  BookOpen,
} from 'lucide-react';
import { useRouter } from '../lib/router';
import { useLanguage } from '../hooks/useLanguage';
import { BLOG_ARTICLES } from '../data/articles';
import { ArticleItem } from '../types';

export const DigitalNewsSection: React.FC = () => {
  const { navigate } = useRouter();
  const { t, isEnglish } = useLanguage();
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Take the 3 latest blog articles
  const latestArticles = BLOG_ARTICLES.slice(0, 3);

  const handleShare = (article: ArticleItem) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/actualites#${article.slug}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <section id="actualites-digitales" className="py-20 sm:py-24 px-4 sm:px-6 lg:px-8 bg-[#F8FAFD] dark:bg-[#01184C]/50 relative transition-colors duration-300">
      {/* Subtle ambient lighting */}
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#0A2254]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-[#D4AF37]/30 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="uppercase tracking-wider text-[11px]">{t('news.badge', 'Veille & Perspectives')}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0E1D38] dark:text-white tracking-[-0.03em] leading-tight text-balance">
              {t('news.title', 'Actualités Digitales')}
            </h2>
            <p className="text-sm sm:text-base text-[#475569] dark:text-slate-300 leading-relaxed text-pretty">
              {t(
                'news.desc',
                "Décryptages, innovations et retours d'expérience sur la relation client omnicanale, les solutions CRM et la transformation digitale à Niamey et au Sahel."
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/actualites')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#01184C] dark:text-[#D4AF37] hover:underline self-start md:self-end cursor-pointer uppercase tracking-wider group"
          >
            <span>{t('news.view_all', 'Consulter toutes les actualités')}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>

        {/* 3 Modern Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {latestArticles.map((article, idx) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.45, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              onClick={() => setSelectedArticle(article)}
              className="gold-glow group relative flex flex-col rounded-3xl bg-white dark:bg-[#0A2254]/80 border border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all duration-300 overflow-hidden cursor-pointer"
            >
              {/* Media Container */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                <img
                  src={article.imageUrl}
                  srcSet={article.srcSet}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                  alt={article.title}
                  width={400}
                  height={250}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-600 ease-out"
                />
                {/* Soft gradient bottom overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#01184C]/85 via-transparent to-transparent pointer-events-none" />

                {/* Category Pill Tag */}
                <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-[#01184C]/90 backdrop-blur-md border border-[#D4AF37]/50 font-mono font-bold text-[11px] text-[#D4AF37] tracking-wider uppercase shadow-sm">
                  {article.category}
                </div>

                {/* Reading duration badge */}
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] text-white/95 font-medium shadow-xs">
                  <Clock className="w-3 h-3 text-[#D4AF37]" />
                  <span>{article.readTime}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 sm:p-7 flex flex-col flex-1">
                {/* Date stamp */}
                <div className="flex items-center gap-2 text-xs font-semibold text-[#536582] dark:text-slate-400 mb-3">
                  <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="tabular-nums">{article.date}</span>
                </div>

                {/* Headline */}
                <h3 className="font-display text-lg sm:text-xl font-bold text-[#0E1D38] dark:text-white leading-snug group-hover:text-[#01184C] dark:group-hover:text-[#D4AF37] transition-colors mb-3 line-clamp-2">
                  {article.title}
                </h3>

                {/* Summary / Excerpt */}
                <p className="text-xs sm:text-[13px] text-[#475569] dark:text-slate-300 leading-relaxed line-clamp-3 mb-5 font-normal">
                  {article.summary}
                </p>

                {/* Topic tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {article.tags.slice(0, 2).map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#EEF2F8] dark:bg-[#01184C] border border-[#DDE4EE] dark:border-white/10 text-[11px] text-slate-600 dark:text-slate-300 font-medium"
                      >
                        <Tag className="w-2.5 h-2.5 text-[#D4AF37]" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer Section */}
                <div className="pt-4 mt-auto border-t border-[#EEF2F8] dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div className="w-8 h-8 rounded-full bg-[#EEF2F8] dark:bg-[#01184C] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] text-xs font-bold shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#0E1D38] dark:text-white truncate">
                        {article.author}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {article.authorRole}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-[#01184C] dark:text-[#D4AF37] group-hover:text-[#D4AF37] dark:group-hover:text-white transition-colors shrink-0">
                    <span>Lire</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      {/* Interactive Reader Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedArticle(null)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-[#D4AF37]/40 shadow-2xl z-10 text-[#0E1D38] dark:text-white"
            >
              {/* Cover Image Header */}
              <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-900">
                <img
                  src={selectedArticle.imageUrl}
                  srcSet={selectedArticle.srcSet}
                  sizes="(max-width: 640px) 100vw, 768px"
                  alt={selectedArticle.title}
                  width={768}
                  height={320}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A2254] via-black/40 to-black/20" />

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 shadow-lg"
                  aria-label="Fermer la modal"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Badges on cover */}
                <div className="absolute bottom-6 left-6 right-6 space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#01184C]/90 backdrop-blur-md border border-[#D4AF37]/50 font-mono font-bold text-xs text-[#D4AF37] uppercase tracking-wider">
                    {selectedArticle.category}
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight">
                    {selectedArticle.title}
                  </h2>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* Meta Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#EEF2F8] dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EEF2F8] dark:bg-[#01184C] border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#0E1D38] dark:text-white">
                        {selectedArticle.author}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedArticle.authorRole}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#D4AF37]" />
                      <span className="tabular-nums">{selectedArticle.date}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#D4AF37]" />
                      <span>{selectedArticle.readTime}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleShare(selectedArticle)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#EEF2F8] dark:bg-[#01184C] border border-[#DDE4EE] dark:border-white/10 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] hover:border-[#D4AF37] transition-colors cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Lien copié' : 'Partager'}</span>
                    </button>
                  </div>
                </div>

                {/* Excerpt Callout */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#EEF2F8] dark:bg-[#01184C]/60 border-l-4 border-[#D4AF37] text-sm sm:text-base italic text-[#0E1D38] dark:text-slate-200 leading-relaxed font-medium">
                  « {selectedArticle.summary} »
                </div>

                {/* Main Article Content */}
                <div className="prose prose-slate dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed space-y-4">
                  {selectedArticle.content.split('\n\n').map((paragraph, pIdx) => {
                    if (paragraph.startsWith('### ')) {
                      return (
                        <h4 key={pIdx} className="font-display text-lg font-bold text-[#01184C] dark:text-[#D4AF37] pt-3">
                          {paragraph.replace('### ', '')}
                        </h4>
                      );
                    }
                    if (paragraph.startsWith('- ')) {
                      const items = paragraph.split('\n');
                      return (
                        <ul key={pIdx} className="list-disc pl-5 space-y-1.5 text-sm sm:text-base text-slate-700 dark:text-slate-300">
                          {items.map((item, iIdx) => (
                            <li key={iIdx}>{item.replace('- ', '')}</li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <p key={pIdx} className="text-slate-700 dark:text-slate-300">
                        {paragraph}
                      </p>
                    );
                  })}
                </div>

                {/* Tags */}
                {selectedArticle.tags && selectedArticle.tags.length > 0 && (
                  <div className="pt-4 flex flex-wrap items-center gap-2 border-t border-[#EEF2F8] dark:border-white/10">
                    <span className="text-xs font-semibold text-slate-400">Thématiques :</span>
                    {selectedArticle.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-3 py-1 rounded-full bg-[#EEF2F8] dark:bg-[#01184C] border border-[#DDE4EE] dark:border-white/10 text-xs font-medium text-slate-600 dark:text-slate-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Modal Footer Call to Action */}
                <div className="p-6 rounded-2xl bg-slate-100 dark:bg-gradient-to-r dark:from-[#01184C] dark:to-[#0A2254] text-[#01184C] dark:text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200 dark:border-[#D4AF37]/30 shadow-md transition-colors">
                  <div>
                    <h5 className="font-display text-base font-bold text-[#01184C] dark:text-white mb-1">
                      Un projet en relation client ou digitalisation ?
                    </h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Échangez avec nos experts à Niamey pour auditer vos besoins et bâtir votre solution.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedArticle(null);
                      navigate('/contact');
                    }}
                    className="px-6 py-3 rounded-full bg-[#D4AF37] hover:bg-[#E5C358] text-[#01184C] font-extrabold text-xs tracking-wider uppercase shrink-0 transition-colors shadow cursor-pointer"
                  >
                    Nous contacter
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
