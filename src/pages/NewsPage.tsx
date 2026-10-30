import React, { useEffect, useState } from 'react';
import {
  Newspaper,
  Bell,
  Check,
  Calendar,
  Clock,
  Building2,
  ArrowRight,
  Tag,
  Share2,
  X,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { useSiteData } from '../lib/DataContext';
import { ArticleItem } from '../types';
import { useRouter } from '../lib/router';

export const NewsPage: React.FC = () => {
  const { navigate } = useRouter();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const categories = ['Tous', 'Relation Client & BPO', 'Solutions CRM & Automatisation', 'Transformation Digitale & IA'];

  // Articles gérés dans Supabase. Le contexte contient déjà les articles
  // intégrés avant la première synchronisation, puis l'état exact de la base.
  const { articles } = useSiteData();
  const allArticles = articles.filter((a) => a.status !== 'draft');

  // Le lecteur ouvert suit les modifications temps réel et se ferme si
  // l'article est supprimé ou repassé en brouillon dans l'espace admin.
  useEffect(() => {
    setSelectedArticle((prev) => {
      if (!prev) return prev;
      const current = articles.find((a) => a.id === prev.id && a.status !== 'draft');
      if (!current) return null;
      return JSON.stringify(current) === JSON.stringify(prev) ? prev : current;
    });
  }, [articles]);

  const filteredArticles = allArticles.filter((art) => {
    const matchesCategory = selectedCategory === 'Tous' || art.category === selectedCategory;
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.tags && art.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCategory && matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setIsSubscribed(true);
  };

  const handleShare = (article: ArticleItem) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/actualites#${article.slug}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="pt-28 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-[#F8FAFD] dark:bg-[#01184C] text-[#0E1D38] dark:text-white transition-colors duration-300 min-h-[80vh]">
      <div className="max-w-7xl mx-auto space-y-10 sm:space-y-12">
        <Breadcrumbs items={[{ label: 'Actualités' }]} />

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#EEF2F8] dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-[#D4AF37]/40 text-xs font-semibold text-[#01184C] dark:text-[#D4AF37] mb-4 shadow-sm">
              <Newspaper className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="uppercase tracking-wider text-[11px]">Actualités & Veille Métier</span>
            </div>
            <h1 className="font-display text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] mb-4 text-balance">
              Actualités & Perspectives
            </h1>
            <p className="text-base text-[#475569] dark:text-slate-300 leading-relaxed text-pretty">
              Analyses, retours d'expérience et bonnes pratiques sur la relation client et la transformation numérique à Niamey et dans l'espace UEMOA.
            </p>
          </div>

          {/* Search bar */}
          <div className="w-full lg:w-80 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un article ou mot-clé..."
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-white/10 text-xs text-[#0E1D38] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] shadow-xs"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#EEF2F8] dark:border-white/10 pb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#01184C] text-white dark:bg-[#D4AF37] dark:text-[#01184C] shadow-sm'
                  : 'bg-white dark:bg-[#0A2254] text-slate-600 dark:text-slate-300 border border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredArticles.map((article, idx) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              whileHover={{ y: -6 }}
              onClick={() => setSelectedArticle(article)}
              className="gold-glow group relative flex flex-col rounded-3xl bg-white dark:bg-[#0A2254]/60 border border-[#DDE4EE] dark:border-white/10 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] transition-all duration-300 overflow-hidden cursor-pointer shadow-sm"
            >
              {/* Media */}
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
                <div className="absolute inset-0 bg-gradient-to-t from-[#01184C]/80 via-transparent to-transparent pointer-events-none" />

                <div className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-[#01184C]/90 backdrop-blur-md border border-[#D4AF37]/50 font-mono font-bold text-[11px] text-[#D4AF37] tracking-wider uppercase shadow-sm">
                  {article.category}
                </div>

                <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-[11px] text-white/95 font-medium shadow-xs">
                  <Clock className="w-3 h-3 text-[#D4AF37]" />
                  <span>{article.readTime}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 sm:p-7 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#536582] dark:text-slate-400 mb-3">
                  <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="tabular-nums">{article.date}</span>
                </div>

                <h3 className="font-display text-lg sm:text-xl font-bold text-[#0E1D38] dark:text-white leading-snug group-hover:text-[#01184C] dark:group-hover:text-[#D4AF37] transition-colors mb-3 line-clamp-2">
                  {article.title}
                </h3>

                <p className="text-xs sm:text-[13px] text-[#475569] dark:text-slate-300 leading-relaxed line-clamp-3 mb-5">
                  {article.summary}
                </p>

                {article.tags && (
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

        {/* Newsletter Signup */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-[#01184C] via-[#0A2254] to-[#01184C] text-white border border-[#D4AF37]/40 shadow-2xl max-w-3xl mx-auto relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-2">
            <Bell className="w-4 h-4 text-[#D4AF37]" />
            <span>Veille & Informations Professionnelles</span>
          </div>
          <h3 className="font-display text-2xl font-bold mb-2">Restez informé de nos parutions</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
            Recevez nos analyses sectorielles et les actualités d'Excellence Services SARL directement par email.
          </p>

          {isSubscribed ? (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37] text-[#D4AF37] text-xs font-semibold">
              <Check className="w-4 h-4 shrink-0" />
              <span>Votre adresse a été enregistrée. Merci pour votre intérêt !</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse email professionnelle"
                className="flex-1 px-4 py-3 rounded-full bg-[#01184C]/80 border border-[#D4AF37]/30 text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
              <button
                type="submit"
                className="px-7 py-3 rounded-full bg-[#D4AF37] text-[#01184C] font-extrabold text-xs hover:bg-[#E5C358] transition-colors shrink-0 cursor-pointer shadow uppercase tracking-wider"
              >
                S'inscrire à la veille
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Interactive Reader Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedArticle(null)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#0A2254] border border-[#DDE4EE] dark:border-[#D4AF37]/40 shadow-2xl z-10 text-[#0E1D38] dark:text-white"
            >
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

                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer border border-white/20 shadow-lg"
                  aria-label="Fermer la modal"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute bottom-6 left-6 right-6 space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#01184C]/90 backdrop-blur-md border border-[#D4AF37]/50 font-mono font-bold text-xs text-[#D4AF37] uppercase tracking-wider">
                    {selectedArticle.category}
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight">
                    {selectedArticle.title}
                  </h2>
                </div>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
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

                <div className="p-4 sm:p-5 rounded-2xl bg-[#EEF2F8] dark:bg-[#01184C]/60 border-l-4 border-[#D4AF37] text-sm sm:text-base italic text-[#0E1D38] dark:text-slate-200 leading-relaxed font-medium">
                  « {selectedArticle.summary} »
                </div>

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

                {selectedArticle.tags && (
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
    </div>
  );
};
