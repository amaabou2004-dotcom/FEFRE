import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  describeSupabaseError,
  isSupabaseConfigured,
  supabase,
  SUPABASE_NOT_CONFIGURED_MESSAGE,
  SUPABASE_TABLES as T,
} from './supabase';
import {
  activityLogFromRow,
  articleFromRow,
  articleToRow,
  ContactMessageFromRow,
  faqFromRow,
  faqToRow,
  mediaFromRow,
  mediaToRow,
  normalizeQuoteInput,
  pageFromRow,
  pageToRow,
  partnerDocumentFromRow,
  partnerDocumentToRow,
  partnerFromRow,
  partnerProjectFromRow,
  partnerProjectToRow,
  partnerToRow,
  projectFromRow,
  projectToRow,
  quoteFromRow,
  sectorFromRow,
  sectorToRow,
  serviceFromRow,
  serviceToRow,
  settingsFromRow,
  settingsToRow,
  testimonialFromRow,
  testimonialToRow,
} from './supabase-mappers';
import {
  ActivityLog,
  ArticleItem,
  ContactMessage,
  FAQItem,
  MediaItem,
  PageContent,
  PartnerDocument,
  PartnerItem,
  PartnerProject,
  PartnerUser,
  ProjectItem,
  QuoteRequest,
  SectorItem,
  ServiceItem,
  SiteSettings,
  TestimonialItem,
} from '../types';
import {
  COMPANY_INFO,
  DEFAULT_PAGES_CONTENT,
  DEFAULT_PARTNERS,
  DEFAULT_PROJECTS,
  FAQ_ITEMS,
  SECTORS,
  SERVICES,
  TESTIMONIALS,
} from '../data/company';
import { SITE_MEDIA_CATALOG } from '../data/media';
import { BLOG_ARTICLES } from '../data/articles';

/**
 * Données du site — désormais alimentées par SUPABASE (PostgreSQL).
 *
 * • Lecture publique des contenus (RLS), temps réel activé : toute
 *   modification faite dans l'espace admin apparaît sans recharger la page.
 * • Écritures réservées aux administrateurs connectés (Supabase Auth +
 *   table admin_users, voir AuthContext et le schéma SQL).
 * • Si Supabase n'est pas configuré (variables d'environnement manquantes),
 *   le site affiche les contenus par défaut du code — jamais d'écran blanc.
 * • L'interface publique de ce contexte est inchangée par rapport à
 *   l'ancienne version Firebase : aucune page n'a eu besoin d'être modifiée.
 */

interface DataContextType {
  settings: SiteSettings;
  services: ServiceItem[];
  sectors: SectorItem[];
  testimonials: TestimonialItem[];
  faqs: FAQItem[];
  pages: Record<string, PageContent>;
  media: MediaItem[];
  articles: ArticleItem[];
  quotes: QuoteRequest[];
  contactMessages: ContactMessage[];
  activityLogs: ActivityLog[];
  partners: PartnerItem[];
  projects: ProjectItem[];
  partnerUser: PartnerUser | null;
  partnerProjects: PartnerProject[];
  partnerDocuments: PartnerDocument[];
  isLoading: boolean;
  isConnectedToCloud: boolean;
  isSupabaseConfigured: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  updateSettings: (settings: Partial<SiteSettings>) => Promise<void>;
  saveService: (service: Partial<ServiceItem>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  saveSector: (sector: Partial<SectorItem>) => Promise<void>;
  deleteSector: (id: string) => Promise<void>;
  saveTestimonial: (item: Partial<TestimonialItem>) => Promise<void>;
  deleteTestimonial: (id: string) => Promise<void>;
  saveFAQ: (item: Partial<FAQItem>) => Promise<void>;
  deleteFAQ: (id: string) => Promise<void>;
  saveFaq: (item: Partial<FAQItem>) => Promise<void>;
  deleteFaq: (id: string) => Promise<void>;
  savePartner: (partner: Partial<PartnerItem>) => Promise<void>;
  deletePartner: (id: string) => Promise<void>;
  saveProject: (project: any) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  saveArticle: (article: Partial<ArticleItem>) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  loginPartner: (email: string) => Promise<{ success: boolean; error?: string }>;
  logoutPartner: () => void;
  savePage: (page: Partial<PageContent>) => Promise<void>;
  saveMedia: (media: Partial<MediaItem>) => Promise<void>;
  deleteMedia: (id: string) => Promise<void>;
  submitQuote: (quote: any) => Promise<{ success: boolean; id?: string; error?: string }>;
  submitContactMessage: (msg: Partial<ContactMessage>) => Promise<{ success: boolean; id?: string; error?: string }>;
  updateQuoteStatus: (id: string, status: QuoteRequest['status'], adminNotes?: string) => Promise<void>;
  updateMessageStatus: (id: string, status: ContactMessage['status'], notes?: string) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  deleteContactMessage: (id: string) => Promise<void>;
  seedDatabaseIfNeeded: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

const DEFAULT_PARTNER_PROJECTS: PartnerProject[] = [
  {
    id: 'pp-01',
    title: 'Programme d’Accélération Relation Client & CRM',
    partnerId: 'partner-active',
    partnerName: 'Partenaire Institutionnel',
    status: 'in_progress',
    startDate: '2026-02-01',
    progress: 65,
    description:
      'Déploiement conjoint d’un centre de contact pilote et intégration des flux de support multicanal.',
    keyDeliverables: [
      'Cartographie des parcours usagers',
      'Paramétrage CRM & canaux digitaux',
      'Formation des téléconseillers à Niamey',
    ],
  },
];

const DEFAULT_PARTNER_DOCUMENTS: PartnerDocument[] = [
  {
    id: 'doc-01',
    title: 'Charte & Normes d’Excellence Opérationnelle',
    partnerId: 'partner-active',
    type: 'guide',
    fileSize: '1.4 MB',
    uploadDate: '2026-02-15',
  },
  {
    id: 'doc-02',
    title: 'Convention Cadre de Coopération Institutionnelle',
    partnerId: 'partner-active',
    type: 'contract',
    fileSize: '850 KB',
    uploadDate: '2026-01-20',
  },
  {
    id: 'doc-03',
    title: 'Spécifications Techniques des Protocoles d’Échange',
    partnerId: 'partner-active',
    type: 'specification',
    fileSize: '2.1 MB',
    uploadDate: '2026-02-28',
  },
];

const byDisplayOrder = (a: any, b: any) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999);

function requireSupabase() {
  if (!supabase) throw new Error(SUPABASE_NOT_CONFIGURED_MESSAGE);
  return supabase;
}

async function upsertRow(table: string, row: Record<string, any>) {
  const sb = requireSupabase();
  const { error } = await sb.from(table).upsert(row, { onConflict: 'id' });
  if (error) throw new Error(describeSupabaseError(error));
}

async function deleteRow(table: string, id: string) {
  const sb = requireSupabase();
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) throw new Error(describeSupabaseError(error));
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(COMPANY_INFO);
  const [services, setServices] = useState<ServiceItem[]>(SERVICES);
  const [sectors, setSectors] = useState<SectorItem[]>(SECTORS);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(TESTIMONIALS);
  const [faqs, setFaqs] = useState<FAQItem[]>(FAQ_ITEMS);
  const [pages, setPages] = useState<Record<string, PageContent>>(DEFAULT_PAGES_CONTENT as any);
  const [media, setMedia] = useState<MediaItem[]>(() => Object.values(SITE_MEDIA_CATALOG));
  const [articles, setArticles] = useState<ArticleItem[]>(BLOG_ARTICLES);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [partners, setPartners] = useState<PartnerItem[]>(DEFAULT_PARTNERS);
  const [projects, setProjects] = useState<ProjectItem[]>(DEFAULT_PROJECTS);
  const [partnerProjects, setPartnerProjects] = useState<PartnerProject[]>(DEFAULT_PARTNER_PROJECTS);
  const [partnerDocuments, setPartnerDocuments] = useState<PartnerDocument[]>(DEFAULT_PARTNER_DOCUMENTS);

  const [partnerUser, setPartnerUser] = useState<PartnerUser | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('es_partner_user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isConnectedToCloud, setIsConnectedToCloud] = useState(false);
  const [error, setError] = useState<string | null>(
    isSupabaseConfigured ? null : SUPABASE_NOT_CONFIGURED_MESSAGE
  );

  const actorEmailRef = useRef<string>('admin@excellence-services-sarl.com');

  const logActivity = useCallback(
    async (action: string, details: string, entityType?: string, entityId?: string) => {
      if (!supabase) return;
      try {
        const { error: logError } = await supabase.from(T.ACTIVITY_LOGS).insert({
          action,
          actor: actorEmailRef.current,
          details,
          type: 'update',
          entity_type: entityType || null,
          entity_id: entityId || null,
        });
        if (logError) console.warn('Journal d’activité non enregistré :', logError.message);
      } catch (err) {
        console.warn('Journal d’activité non enregistré :', err);
      }
    },
    []
  );

  /* ---------------------------------------------------------------- */
  /* Chargement depuis Supabase                                        */
  /* ---------------------------------------------------------------- */

  const fetchRows = useCallback(async (table: string, orderBy?: string, ascending = true) => {
    if (!supabase) return null;
    let query = supabase.from(table).select('*');
    if (orderBy) query = query.order(orderBy, { ascending, nullsFirst: false });
    const { data, error: qError } = await query;
    if (qError) {
      console.warn(`[Supabase] Lecture ${table} :`, qError.message);
      setError(describeSupabaseError(qError));
      return null;
    }
    return data as Record<string, any>[];
  }, []);

  const loadSettings = useCallback(async () => {
    const rows = await fetchRows(T.SETTINGS);
    if (rows) {
      setIsConnectedToCloud(true);
      const row = rows.find((r) => r.id === 'general') || rows[0];
      if (row) setSettings((prev) => settingsFromRow(row, prev));
    }
  }, [fetchRows]);

  const loadServices = useCallback(async () => {
    const rows = await fetchRows(T.SERVICES, 'display_order');
    if (rows && rows.length) setServices(rows.map(serviceFromRow).sort(byDisplayOrder));
  }, [fetchRows]);

  const loadSectors = useCallback(async () => {
    const rows = await fetchRows(T.SECTORS, 'display_order');
    if (rows && rows.length) setSectors(rows.map(sectorFromRow).sort(byDisplayOrder));
  }, [fetchRows]);

  const loadTestimonials = useCallback(async () => {
    const rows = await fetchRows(T.TESTIMONIALS, 'display_order');
    if (rows && rows.length) setTestimonials(rows.map(testimonialFromRow).sort(byDisplayOrder));
  }, [fetchRows]);

  const loadFaqs = useCallback(async () => {
    const rows = await fetchRows(T.FAQS, 'display_order');
    if (rows && rows.length) setFaqs(rows.map(faqFromRow).sort(byDisplayOrder));
  }, [fetchRows]);

  const loadPages = useCallback(async () => {
    const rows = await fetchRows(T.PAGES);
    if (rows && rows.length) {
      const map: Record<string, PageContent> = {};
      rows.map(pageFromRow).forEach((p) => {
        map[p.slug || p.id] = p;
      });
      setPages((prev) => ({ ...prev, ...map }));
    }
  }, [fetchRows]);

  const loadMedia = useCallback(async () => {
    const rows = await fetchRows(T.MEDIA);
    if (rows && rows.length) {
      // Les médias Supabase remplacent/étendent le catalogue local livré avec le site.
      const merged = [...Object.values(SITE_MEDIA_CATALOG)];
      for (const item of rows.map(mediaFromRow)) {
        const idx = merged.findIndex((m) => m.id === item.id || (item.location && m.location === item.location));
        if (idx >= 0) merged[idx] = item;
        else merged.push(item);
      }
      setMedia(merged);
    }
  }, [fetchRows]);

  const loadArticles = useCallback(async () => {
    const rows = await fetchRows(T.ARTICLES, 'display_order');
    if (rows && rows.length) setArticles(rows.map(articleFromRow).sort(byDisplayOrder));
  }, [fetchRows]);

  const loadPartners = useCallback(async () => {
    const rows = await fetchRows(T.PARTNERS, 'display_order');
    if (rows && rows.length) setPartners(rows.map(partnerFromRow).sort(byDisplayOrder));
  }, [fetchRows]);

  const loadProjects = useCallback(async () => {
    const rows = await fetchRows(T.PROJECTS, 'display_order');
    if (rows && rows.length) setProjects(rows.map(projectFromRow).sort(byDisplayOrder));
  }, [fetchRows]);

  const loadPartnerSpace = useCallback(async () => {
    const projRows = await fetchRows(T.PARTNER_PROJECTS);
    if (projRows && projRows.length) setPartnerProjects(projRows.map(partnerProjectFromRow));
    const docRows = await fetchRows(T.PARTNER_DOCUMENTS);
    if (docRows && docRows.length) setPartnerDocuments(docRows.map(partnerDocumentFromRow));
  }, [fetchRows]);

  // Données privées : la RLS ne renvoie des lignes qu'aux administrateurs.
  const loadQuotes = useCallback(async () => {
    const rows = await fetchRows(T.QUOTES, 'created_at', false);
    if (rows) setQuotes(rows.map(quoteFromRow));
  }, [fetchRows]);

  const loadContactMessages = useCallback(async () => {
    const rows = await fetchRows(T.CONTACT_MESSAGES, 'created_at', false);
    if (rows) setContactMessages(rows.map(ContactMessageFromRow));
  }, [fetchRows]);

  const loadActivityLogs = useCallback(async () => {
    const rows = await fetchRows(T.ACTIVITY_LOGS, 'created_at', false);
    if (rows) setActivityLogs(rows.map(activityLogFromRow).slice(0, 100));
  }, [fetchRows]);

  const loadersByTable = useRef<Record<string, () => Promise<void>>>({});
  loadersByTable.current = {
    [T.SETTINGS]: loadSettings,
    [T.SERVICES]: loadServices,
    [T.SECTORS]: loadSectors,
    [T.TESTIMONIALS]: loadTestimonials,
    [T.FAQS]: loadFaqs,
    [T.PAGES]: loadPages,
    [T.MEDIA]: loadMedia,
    [T.ARTICLES]: loadArticles,
    [T.PARTNERS]: loadPartners,
    [T.PROJECTS]: loadProjects,
    [T.PARTNER_PROJECTS]: loadPartnerSpace,
    [T.PARTNER_DOCUMENTS]: loadPartnerSpace,
    [T.QUOTES]: loadQuotes,
    [T.CONTACT_MESSAGES]: loadContactMessages,
    [T.ACTIVITY_LOGS]: loadActivityLogs,
  };

  const refreshData = useCallback(async () => {
    await Promise.all(Object.values(loadersByTable.current).map((fn) => fn()));
  }, []);

  /* ---------------------------------------------------------------- */
  /* Amorçage (seed) : importe les contenus par défaut dans Supabase   */
  /* ---------------------------------------------------------------- */

  const seedCollection = useCallback(
    async (table: string, rows: Record<string, any>[], force: boolean) => {
      const sb = requireSupabase();
      if (!force) {
        const { count, error: cError } = await sb
          .from(table)
          .select('id', { count: 'exact', head: true });
        if (cError) throw new Error(describeSupabaseError(cError));
        if ((count ?? 0) > 0) return;
      }
      if (!rows.length) return;
      const { error: uError } = await sb.from(table).upsert(rows, { onConflict: 'id' });
      if (uError) throw new Error(describeSupabaseError(uError));
    },
    []
  );

  const runSeed = useCallback(
    async (force: boolean) => {
      requireSupabase();
      await seedCollection(T.SETTINGS, [settingsToRow(COMPANY_INFO)], force);
      await seedCollection(
        T.SERVICES,
        SERVICES.map((s, i) => serviceToRow({ ...s, displayOrder: s.displayOrder ?? i + 1, status: s.status ?? 'active' })),
        force
      );
      await seedCollection(
        T.SECTORS,
        SECTORS.map((s, i) => sectorToRow({ ...s, displayOrder: s.displayOrder ?? i + 1, status: s.status ?? 'active' })),
        force
      );
      await seedCollection(
        T.TESTIMONIALS,
        TESTIMONIALS.map((t, i) => testimonialToRow({ ...t, displayOrder: t.displayOrder ?? i + 1, status: t.status ?? 'published' })),
        force
      );
      await seedCollection(T.FAQS, FAQ_ITEMS.map(faqToRow), force);
      await seedCollection(
        T.PAGES,
        Object.values(DEFAULT_PAGES_CONTENT).map((p: any) => pageToRow(p)),
        force
      );
      await seedCollection(T.PARTNERS, DEFAULT_PARTNERS.map(partnerToRow), force);
      await seedCollection(
        T.PROJECTS,
        DEFAULT_PROJECTS.map((p, i) => projectToRow({ ...p, displayOrder: p.displayOrder ?? i + 1 })),
        force
      );
      await seedCollection(
        T.ARTICLES,
        BLOG_ARTICLES.map((a, i) => articleToRow({ ...a, displayOrder: a.displayOrder ?? i + 1 })),
        force
      );
      await seedCollection(T.PARTNER_PROJECTS, DEFAULT_PARTNER_PROJECTS.map(partnerProjectToRow), force);
      await seedCollection(T.PARTNER_DOCUMENTS, DEFAULT_PARTNER_DOCUMENTS.map(partnerDocumentToRow), force);
      await refreshData();
    },
    [seedCollection, refreshData]
  );

  const seedDatabaseIfNeeded = useCallback(async () => {
    try {
      await runSeed(false);
    } catch (err) {
      console.warn('Amorçage Supabase :', err);
    }
  }, [runSeed]);

  const resetToDefaults = useCallback(async () => {
    await runSeed(true);
    void logActivity('RÉINITIALISATION', 'Contenus par défaut réimportés dans Supabase');
  }, [runSeed, logActivity]);

  /* ---------------------------------------------------------------- */
  /* Chargement initial + temps réel + session admin                   */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user?.email) actorEmailRef.current = data.session.user.email;
        await refreshData();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    // Temps réel : recharge la collection concernée dès qu'une ligne change.
    let channel = supabase.channel('site-data-changes');
    for (const table of Object.keys(loadersByTable.current)) {
      channel = channel.on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table },
        () => {
          void loadersByTable.current[table]?.();
        }
      );
    }
    channel.subscribe();

    // À la connexion d'un admin : données privées + amorçage si base vide.
    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email) actorEmailRef.current = session.user.email;
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setTimeout(() => {
          void loadQuotes();
          void loadContactMessages();
          void loadActivityLogs();
          if (event === 'SIGNED_IN') void seedDatabaseIfNeeded();
        }, 0);
      }
    });

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
      authSub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------------------------------------------------------- */
  /* Écritures (optimistes, avec retour arrière en cas d'erreur)       */
  /* ---------------------------------------------------------------- */

  function makeSaveList<T extends { id: string }>(
    table: string,
    items: T[],
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    toRow: (item: T) => Record<string, any>,
    idPrefix: string,
    logAction: string,
    describe: (item: Partial<T>) => string
  ) {
    return async (item: Partial<T>) => {
      const existing = item.id ? items.find((i) => i.id === item.id) : undefined;
      const id = item.id || `${idPrefix}-${Date.now()}`;
      const payload = { ...existing, ...item, id, updatedAt: new Date().toISOString() } as T;
      const prev = items;
      setter((list) => {
        const idx = list.findIndex((i) => i.id === id);
        if (idx >= 0) {
          const copy = [...list];
          copy[idx] = payload;
          return copy;
        }
        return [...list, payload];
      });
      try {
        await upsertRow(table, toRow(payload));
        void logActivity(logAction, describe(item), table, id);
      } catch (err) {
        setter(prev);
        throw err;
      }
    };
  }

  function makeDeleteList<T extends { id: string }>(
    table: string,
    items: T[],
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    logAction: string
  ) {
    return async (id: string) => {
      const prev = items;
      setter((list) => list.filter((i) => i.id !== id));
      try {
        await deleteRow(table, id);
        void logActivity(logAction, `Élément supprimé ID : ${id}`, table, id);
      } catch (err) {
        setter(prev);
        throw err;
      }
    };
  }

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    const prev = settings;
    const updated = { ...settings, ...newSettings, updatedAt: new Date().toISOString() };
    setSettings(updated);
    try {
      await upsertRow(T.SETTINGS, settingsToRow(updated));
      void logActivity('MODIFICATION_PARAMÈTRES', 'Mise à jour des informations institutionnelles');
    } catch (err) {
      setSettings(prev);
      throw err;
    }
  };

  const saveService = makeSaveList(T.SERVICES, services, setServices, serviceToRow, 'service', 'ENREGISTREMENT_SERVICE', (i) => `Service enregistré : ${i.title ?? ''}`);
  const deleteService = makeDeleteList(T.SERVICES, services, setServices, 'SUPPRESSION_SERVICE');
  const saveSector = makeSaveList(T.SECTORS, sectors, setSectors, sectorToRow, 'sector', 'ENREGISTREMENT_SECTEUR', (i) => `Secteur enregistré : ${i.name ?? ''}`);
  const deleteSector = makeDeleteList(T.SECTORS, sectors, setSectors, 'SUPPRESSION_SECTEUR');
  const saveTestimonial = makeSaveList(T.TESTIMONIALS, testimonials, setTestimonials, testimonialToRow, 'test', 'ENREGISTREMENT_TÉMOIGNAGE', (i) => `Témoignage de : ${i.author ?? ''}`);
  const deleteTestimonial = makeDeleteList(T.TESTIMONIALS, testimonials, setTestimonials, 'SUPPRESSION_TÉMOIGNAGE');
  const saveFAQ = makeSaveList(T.FAQS, faqs, setFaqs, faqToRow, 'faq', 'ENREGISTREMENT_FAQ', (i) => `Question FAQ : ${(i.question ?? '').slice(0, 40)}`);
  const deleteFAQ = makeDeleteList(T.FAQS, faqs, setFaqs, 'SUPPRESSION_FAQ');
  const savePartner = makeSaveList(T.PARTNERS, partners, setPartners, partnerToRow, 'partner', 'ENREGISTREMENT_PARTENAIRE', (i) => `Partenaire : ${i.name ?? ''}`);
  const deletePartner = makeDeleteList(T.PARTNERS, partners, setPartners, 'SUPPRESSION_PARTENAIRE');
  const saveProject = makeSaveList(T.PROJECTS, projects, setProjects, projectToRow, 'proj', 'ENREGISTREMENT_RÉALISATION', (i) => `Projet : ${i.title ?? ''}`);
  const deleteProject = makeDeleteList(T.PROJECTS, projects, setProjects, 'SUPPRESSION_RÉALISATION');
  const saveArticle = makeSaveList(T.ARTICLES, articles, setArticles, articleToRow, 'art', 'ENREGISTREMENT_ARTICLE', (i) => `Article : ${i.title ?? ''}`);
  const deleteArticle = makeDeleteList(T.ARTICLES, articles, setArticles, 'SUPPRESSION_ARTICLE');
  const saveMedia = makeSaveList(T.MEDIA, media, setMedia, mediaToRow, 'media', 'AJOUT_MÉDIA', (i) => `Média : ${i.name ?? ''}`);
  const deleteMedia = makeDeleteList(T.MEDIA, media, setMedia, 'SUPPRESSION_MÉDIA');

  const savePage = async (item: Partial<PageContent>) => {
    const existing = Object.values(pages).find((p) => p.id === item.id || (item.slug && p.slug === item.slug));
    const id = item.id || existing?.id || `page-${item.slug || Date.now()}`;
    const payload = { ...existing, ...item, id, updatedAt: new Date().toISOString() } as PageContent;
    const prev = pages;
    setPages((p) => ({ ...p, [payload.slug || id]: payload }));
    try {
      await upsertRow(T.PAGES, pageToRow(payload));
      void logActivity('MODIFICATION_PAGE', `Page modifiée : ${payload.name || payload.title}`, 'pages', id);
    } catch (err) {
      setPages(prev);
      throw err;
    }
  };

  /* ---------------------------------------------------------------- */
  /* Formulaires publics + traitement admin                            */
  /* ---------------------------------------------------------------- */

  const submitQuote = async (quote: any) => {
    if (!supabase) return { success: false, error: SUPABASE_NOT_CONFIGURED_MESSAGE };
    try {
      // Pas de .select() après insertion : les visiteurs n'ont (volontairement)
      // aucun droit de lecture sur les devis. L'ID est donc généré ici.
      const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `quote-${Date.now()}`;
      const { error: insError } = await supabase.from(T.QUOTES).insert({ id, ...normalizeQuoteInput(quote) });
      if (insError) throw insError;
      return { success: true, id };
    } catch (err: any) {
      console.error('Échec envoi devis Supabase :', err);
      return { success: false, error: describeSupabaseError(err) };
    }
  };

  const submitContactMessage = async (msg: Partial<ContactMessage>) => {
    if (!supabase) return { success: false, error: SUPABASE_NOT_CONFIGURED_MESSAGE };
    try {
      const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `msg-${Date.now()}`;
      const { error: insError } = await supabase.from(T.CONTACT_MESSAGES).insert({
        id,
        full_name: msg.fullName || '',
        company: msg.company || null,
        email: msg.email || '',
        phone: msg.phone || null,
        subject: msg.subject || 'Message via le site web',
        message: msg.message || '',
        status: 'unread',
      });
      if (insError) throw insError;
      return { success: true, id };
    } catch (err: any) {
      console.error('Échec envoi message Supabase :', err);
      return { success: false, error: describeSupabaseError(err) };
    }
  };

  const updateQuoteStatus = async (id: string, status: QuoteRequest['status'], adminNotes?: string) => {
    const sb = requireSupabase();
    const updates: Record<string, any> = { status };
    if (adminNotes !== undefined) updates.admin_notes = adminNotes;
    const prev = quotes;
    setQuotes((list) => list.map((q) => (q.id === id ? { ...q, status, ...(adminNotes !== undefined ? { adminNotes } : {}) } : q)));
    const { error: uError } = await sb.from(T.QUOTES).update(updates).eq('id', id);
    if (uError) {
      setQuotes(prev);
      throw new Error(describeSupabaseError(uError));
    }
    void logActivity('MISE_A_JOUR_DEVIS', `Statut devis ${id} → ${status}`, 'quotes', id);
  };

  const updateMessageStatus = async (id: string, status: ContactMessage['status'], notes?: string) => {
    const sb = requireSupabase();
    const updates: Record<string, any> = { status };
    if (notes !== undefined) updates.notes = notes;
    const prev = contactMessages;
    setContactMessages((list) => list.map((m) => (m.id === id ? { ...m, status, ...(notes !== undefined ? { notes } : {}) } : m)));
    const { error: uError } = await sb.from(T.CONTACT_MESSAGES).update(updates).eq('id', id);
    if (uError) {
      setContactMessages(prev);
      throw new Error(describeSupabaseError(uError));
    }
    void logActivity('MISE_A_JOUR_MESSAGE', `Statut message ${id} → ${status}`, 'contact_messages', id);
  };

  const deleteQuote = makeDeleteList(T.QUOTES, quotes, setQuotes, 'SUPPRESSION_DEVIS');
  const deleteContactMessage = makeDeleteList(T.CONTACT_MESSAGES, contactMessages, setContactMessages, 'SUPPRESSION_MESSAGE');

  /* ---------------------------------------------------------------- */
  /* Espace partenaire (accès simple par e-mail, inchangé)             */
  /* ---------------------------------------------------------------- */

  const loginPartner = async (emailInput: string) => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return { success: false, error: 'Veuillez saisir votre adresse e-mail.' };
    const user: PartnerUser = {
      id: `usr-${Date.now()}`,
      fullName: email.split('@')[0].toUpperCase(),
      company: 'Partenaire Accrédité',
      email,
    };
    setPartnerUser(user);
    localStorage.setItem('es_partner_user', JSON.stringify(user));
    void logActivity('CONNEXION_ESPACE_PARTENAIRE', `Accès portail partenaire : ${email}`);
    return { success: true };
  };

  const logoutPartner = () => {
    setPartnerUser(null);
    localStorage.removeItem('es_partner_user');
  };

  return (
    <DataContext.Provider
      value={{
        settings,
        services,
        sectors,
        testimonials,
        faqs,
        pages,
        media,
        articles,
        quotes,
        contactMessages,
        activityLogs,
        partners,
        projects,
        partnerUser,
        partnerProjects,
        partnerDocuments,
        isLoading,
        isConnectedToCloud,
        isSupabaseConfigured,
        error,
        refreshData,
        updateSettings,
        saveService,
        deleteService,
        saveSector,
        deleteSector,
        saveTestimonial,
        deleteTestimonial,
        saveFAQ,
        deleteFAQ,
        saveFaq: saveFAQ,
        deleteFaq: deleteFAQ,
        savePartner,
        deletePartner,
        saveProject,
        deleteProject,
        saveArticle,
        deleteArticle,
        loginPartner,
        logoutPartner,
        savePage,
        saveMedia,
        deleteMedia,
        submitQuote,
        submitContactMessage,
        updateQuoteStatus,
        updateMessageStatus,
        deleteQuote,
        deleteContactMessage,
        seedDatabaseIfNeeded,
        resetToDefaults,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useSiteData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useSiteData must be used within a DataProvider');
  }
  return context;
};
