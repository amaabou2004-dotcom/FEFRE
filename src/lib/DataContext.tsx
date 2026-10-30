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

export type RealtimeStatus =
  | 'disabled'
  | 'connecting'
  | 'subscribed'
  | 'reconnecting'
  | 'error'
  | 'closed';

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
  realtimeStatus: RealtimeStatus;
  lastSyncedAt: string | null;
  isSyncing: boolean;
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

const isSameData = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function setIfChanged<T>(setter: React.Dispatch<React.SetStateAction<T>>, next: T) {
  setter((prev) => (isSameData(prev, next) ? prev : next));
}

function requireSupabase() {
  if (!supabase) throw new Error(SUPABASE_NOT_CONFIGURED_MESSAGE);
  return supabase;
}

function assertRowsAffected(data: unknown, operation: string, table: string) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(
      `${operation} non appliqué dans Supabase (table « ${table} » : aucune ligne affectée). ` +
        'Votre session administrateur a peut-être expiré : reconnectez-vous puis réessayez.'
    );
  }
}

async function upsertRow(table: string, row: Record<string, any>) {
  const sb = requireSupabase();
  // `.select('id')` force PostgREST à confirmer la ligne réellement écrite.
  // Sans cela, une RLS restrictive peut répondre « succès » avec 0 ligne modifiée.
  const { data, error } = await sb.from(table).upsert(row, { onConflict: 'id' }).select('id');
  if (error) throw new Error(describeSupabaseError(error));
  assertRowsAffected(data, 'Enregistrement', table);
}

async function deleteRow(table: string, id: string) {
  const sb = requireSupabase();
  const { data, error } = await sb.from(table).delete().eq('id', id).select('id');
  if (error) throw new Error(describeSupabaseError(error));
  assertRowsAffected(data, 'Suppression', table);
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
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>(
    supabase ? 'connecting' : 'disabled'
  );
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const actorEmailRef = useRef<string>('admin@excellence-services-sarl.com');
  const refreshInFlightRef = useRef<Promise<void> | null>(null);
  const seedCheckInFlightRef = useRef(false);
  const fetchSequenceByTableRef = useRef<Record<string, number>>({});

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
    const sequence = (fetchSequenceByTableRef.current[table] ?? 0) + 1;
    fetchSequenceByTableRef.current[table] = sequence;
    let query = supabase.from(table).select('*');
    if (orderBy) query = query.order(orderBy, { ascending, nullsFirst: false });
    const { data, error: qError } = await query;
    // Une lecture plus récente de cette table a déjà été lancée : ignorer
    // cette réponse pour ne pas réafficher une ancienne version des données.
    if (fetchSequenceByTableRef.current[table] !== sequence) return null;
    if (qError) {
      console.warn(`[Supabase] Lecture ${table} :`, qError.message);
      setError(describeSupabaseError(qError));
      return null;
    }
    return data as Record<string, any>[];
  }, []);

  // Règle temps réel fondamentale : dès que Supabase répond avec un tableau,
  // ce tableau fait foi — y compris lorsqu'il est VIDE. Ne jamais conserver
  // l'ancien état sous prétexte que `rows.length === 0`, sinon la suppression
  // du dernier élément d'une collection ne s'affiche jamais côté visiteurs.
  // Les valeurs intégrées au code ne servent qu'avant la première réponse
  // Supabase ou si la lecture échoue (`rows === null`).
  const loadSettings = useCallback(async () => {
    const rows = await fetchRows(T.SETTINGS);
    if (!rows) return false;
    setIsConnectedToCloud(true);
    const row = rows.find((r) => r.id === 'general') || rows[0];
    if (row) {
      setSettings((prev) => {
        const next = settingsFromRow(row, prev);
        return isSameData(prev, next) ? prev : next;
      });
    }
    return true;
  }, [fetchRows]);

  const loadServices = useCallback(async () => {
    const rows = await fetchRows(T.SERVICES, 'display_order');
    if (!rows) return false;
    setIfChanged(setServices, rows.map(serviceFromRow).sort(byDisplayOrder));
    return true;
  }, [fetchRows]);

  const loadSectors = useCallback(async () => {
    const rows = await fetchRows(T.SECTORS, 'display_order');
    if (!rows) return false;
    setIfChanged(setSectors, rows.map(sectorFromRow).sort(byDisplayOrder));
    return true;
  }, [fetchRows]);

  const loadTestimonials = useCallback(async () => {
    const rows = await fetchRows(T.TESTIMONIALS, 'display_order');
    if (!rows) return false;
    setIfChanged(setTestimonials, rows.map(testimonialFromRow).sort(byDisplayOrder));
    return true;
  }, [fetchRows]);

  const loadFaqs = useCallback(async () => {
    const rows = await fetchRows(T.FAQS, 'display_order');
    if (!rows) return false;
    setIfChanged(setFaqs, rows.map(faqFromRow).sort(byDisplayOrder));
    return true;
  }, [fetchRows]);

  const loadPages = useCallback(async () => {
    const rows = await fetchRows(T.PAGES);
    if (!rows) return false;
    const map: Record<string, PageContent> = {};
    rows.map(pageFromRow).forEach((p) => {
      map[p.slug || p.id] = p;
    });
    // Remplacement exact : un ancien slug supprimé/renommé ne doit pas survivre.
    setIfChanged(setPages, map);
    return true;
  }, [fetchRows]);

  const loadMedia = useCallback(async () => {
    const rows = await fetchRows(T.MEDIA);
    if (!rows) return false;
    // On reconstruit toujours depuis le catalogue livré avec le site :
    // supprimer une surcharge Supabase restaure donc immédiatement l'image
    // d'origine, au lieu de laisser l'ancienne fusion en mémoire.
    const merged = [...Object.values(SITE_MEDIA_CATALOG)];
    for (const item of rows.map(mediaFromRow)) {
      const idx = merged.findIndex(
        (m) => m.id === item.id || (item.location && m.location === item.location)
      );
      if (idx >= 0) merged[idx] = item;
      else merged.push(item);
    }
    setIfChanged(setMedia, merged);
    return true;
  }, [fetchRows]);

  const loadArticles = useCallback(async () => {
    const rows = await fetchRows(T.ARTICLES, 'display_order');
    if (!rows) return false;
    setIfChanged(setArticles, rows.map(articleFromRow).sort(byDisplayOrder));
    return true;
  }, [fetchRows]);

  const loadPartners = useCallback(async () => {
    const rows = await fetchRows(T.PARTNERS, 'display_order');
    if (!rows) return false;
    setIfChanged(setPartners, rows.map(partnerFromRow).sort(byDisplayOrder));
    return true;
  }, [fetchRows]);

  const loadProjects = useCallback(async () => {
    const rows = await fetchRows(T.PROJECTS, 'display_order');
    if (!rows) return false;
    setIfChanged(setProjects, rows.map(projectFromRow).sort(byDisplayOrder));
    return true;
  }, [fetchRows]);

  const loadPartnerSpace = useCallback(async () => {
    const projRows = await fetchRows(T.PARTNER_PROJECTS);
    if (projRows) setIfChanged(setPartnerProjects, projRows.map(partnerProjectFromRow));
    const docRows = await fetchRows(T.PARTNER_DOCUMENTS);
    if (docRows) setIfChanged(setPartnerDocuments, docRows.map(partnerDocumentFromRow));
    return Boolean(projRows && docRows);
  }, [fetchRows]);

  // Données privées : la RLS ne renvoie des lignes qu'aux administrateurs.
  const loadQuotes = useCallback(async () => {
    const rows = await fetchRows(T.QUOTES, 'created_at', false);
    if (!rows) return false;
    setIfChanged(setQuotes, rows.map(quoteFromRow));
    return true;
  }, [fetchRows]);

  const loadContactMessages = useCallback(async () => {
    const rows = await fetchRows(T.CONTACT_MESSAGES, 'created_at', false);
    if (!rows) return false;
    setIfChanged(setContactMessages, rows.map(ContactMessageFromRow));
    return true;
  }, [fetchRows]);

  const loadActivityLogs = useCallback(async () => {
    const rows = await fetchRows(T.ACTIVITY_LOGS, 'created_at', false);
    if (!rows) return false;
    setIfChanged(setActivityLogs, rows.map(activityLogFromRow).slice(0, 100));
    return true;
  }, [fetchRows]);

  const loadersByTable = useRef<Record<string, () => Promise<boolean>>>({});
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
    if (!supabase) return;
    if (refreshInFlightRef.current) return refreshInFlightRef.current;

    const run = (async () => {
      setIsSyncing(true);
      try {
        // `Set` évite de lancer deux fois `loadPartnerSpace` (2 tables, 1 loader).
        const results = await Promise.all(
          [...new Set(Object.values(loadersByTable.current))].map((fn) => fn())
        );
        if (results.every(Boolean)) {
          setIsConnectedToCloud(true);
          setError(null);
          setLastSyncedAt(new Date().toISOString());
        }
      } finally {
        setIsSyncing(false);
        refreshInFlightRef.current = null;
      }
    })();

    refreshInFlightRef.current = run;
    return run;
  }, []);

  const refreshTable = useCallback(async (table: string) => {
    const loader = loadersByTable.current[table];
    if (!loader) return false;
    const ok = await loader();
    if (ok) setLastSyncedAt(new Date().toISOString());
    return ok;
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
      const { data, error: uError } = await sb
        .from(table)
        .upsert(rows, { onConflict: 'id' })
        .select('id');
      if (uError) throw new Error(describeSupabaseError(uError));
      if (!Array.isArray(data) || data.length !== rows.length) {
        throw new Error(`Amorçage incomplet dans Supabase (table « ${table} »).`);
      }
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
    if (seedCheckInFlightRef.current) return;
    seedCheckInFlightRef.current = true;
    try {
      const sb = requireSupabase();

      // IMPORTANT : `site_settings` est le marqueur d'installation du site.
      // S'il existe, la base a déjà été initialisée : on ne réimporte JAMAIS
      // automatiquement une collection devenue vide. Sans ce garde-fou,
      // supprimer volontairement tous les partenaires (ou services, FAQ…)
      // les faisait réapparaître à la connexion admin suivante.
      const { data: settingsRow, error: settingsError } = await sb
        .from(T.SETTINGS)
        .select('id')
        .eq('id', 'general')
        .maybeSingle();
      if (settingsError) throw new Error(describeSupabaseError(settingsError));
      if (settingsRow) return;

      // Sécurité supplémentaire : si un contenu géré existe déjà alors que
      // les paramètres sont absents, la base n'est pas une installation neuve.
      const coreTables = [
        T.SERVICES,
        T.SECTORS,
        T.TESTIMONIALS,
        T.FAQS,
        T.PAGES,
        T.PARTNERS,
        T.PROJECTS,
        T.ARTICLES,
        T.PARTNER_PROJECTS,
        T.PARTNER_DOCUMENTS,
      ];
      const counts = await Promise.all(
        coreTables.map(async (table) => {
          const { count, error: countError } = await sb
            .from(table)
            .select('id', { count: 'exact', head: true });
          if (countError) throw new Error(describeSupabaseError(countError));
          return count ?? 0;
        })
      );
      if (counts.some((count) => count > 0)) return;

      // Installation réellement neuve : toutes les tables de contenu sont vides.
      await runSeed(false);
    } catch (err) {
      console.warn('Amorçage Supabase :', err);
    } finally {
      seedCheckInFlightRef.current = false;
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
      setRealtimeStatus('disabled');
      setIsLoading(false);
      return;
    }

    type SiteRealtimeChannel = ReturnType<NonNullable<typeof supabase>['channel']>;

    let cancelled = false;
    let channel: SiteRealtimeChannel | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempt = 0;
    let lastAutoRefreshAt = 0;
    const tableRefreshTimers = new Map<string, ReturnType<typeof setTimeout>>();

    const scheduleTableRefresh = (table: string) => {
      const existingTimer = tableRefreshTimers.get(table);
      if (existingTimer) clearTimeout(existingTimer);
      const timer = setTimeout(() => {
        tableRefreshTimers.delete(table);
        void refreshTable(table);
      }, 120);
      tableRefreshTimers.set(table, timer);
    };

    const scheduleReconnect = () => {
      if (cancelled || reconnectTimer) return;
      reconnectAttempt += 1;
      setRealtimeStatus('reconnecting');
      const delay = Math.min(1000 * 2 ** Math.max(0, reconnectAttempt - 1), 30000);
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        void restartChannel();
      }, delay);
    };

    const subscribe = () => {
      if (cancelled) return;
      setRealtimeStatus(reconnectAttempt > 0 ? 'reconnecting' : 'connecting');

      // Nom unique : évite toute collision avec un ancien canal encore en
      // cours de fermeture (notamment avec React.StrictMode en développement).
      const channelSuffix =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      let nextChannel = supabase.channel(`site-data-changes-${channelSuffix}`);

      for (const table of Object.keys(loadersByTable.current)) {
        nextChannel = nextChannel.on(
          'postgres_changes' as any,
          { event: '*', schema: 'public', table },
          () => scheduleTableRefresh(table)
        );
      }

      channel = nextChannel;
      const subscribedChannel = nextChannel;
      subscribedChannel.subscribe((status, err) => {
        if (cancelled || channel !== subscribedChannel) return;

        if (status === 'SUBSCRIBED') {
          reconnectAttempt = 0;
          if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
          }
          setRealtimeStatus('subscribed');
          setIsConnectedToCloud(true);
          // Resynchronisation complète après (re)connexion : aucun événement
          // manqué pendant une coupure réseau ne doit laisser d'ancien contenu.
          void refreshData();
          return;
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          if (err) console.warn('[Supabase Realtime]', status, err.message);
          setRealtimeStatus(status === 'CLOSED' ? 'closed' : 'error');
          scheduleReconnect();
        }
      });
    };

    const restartChannel = async () => {
      const previousChannel = channel;
      channel = null;
      if (previousChannel) await supabase.removeChannel(previousChannel);
      if (!cancelled) subscribe();
    };

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session?.user?.email) actorEmailRef.current = data.session.user.email;
        if (data.session?.access_token) {
          await supabase.realtime.setAuth(data.session.access_token);
        }
        await refreshData();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    subscribe();

    // Filet de sécurité si le WebSocket est bloqué ou interrompu : le site
    // se resynchronise au retour sur l'onglet, au retour du réseau et au
    // maximum toutes les 60 secondes pendant que la page est visible.
    const refreshWhenVisible = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastAutoRefreshAt < 3000) return;
      lastAutoRefreshAt = now;
      void refreshData();
    };
    const handleOnline = () => {
      lastAutoRefreshAt = Date.now();
      void refreshData();
      if (channel?.state !== 'joined') scheduleReconnect();
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('online', handleOnline);
    const syncInterval = setInterval(refreshWhenVisible, 60000);

    // À la connexion/déconnexion d'un admin : appliquer le jeton au temps
    // réel (données privées soumises à la RLS), rouvrir le canal, recharger
    // les données, puis n'amorcer que si la base est réellement neuve.
    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email) actorEmailRef.current = session.user.email;
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setTimeout(() => {
          void (async () => {
            try {
              await supabase.realtime.setAuth(session?.access_token ?? null);
              if (event !== 'TOKEN_REFRESHED') await restartChannel();
              await refreshData();
              if (event === 'SIGNED_IN') await seedDatabaseIfNeeded();
            } catch (err) {
              console.warn('[Supabase] Resynchronisation après changement de session :', err);
              scheduleReconnect();
            }
          })();
        }, 0);
      }
    });

    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      tableRefreshTimers.forEach((timer) => clearTimeout(timer));
      tableRefreshTimers.clear();
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('online', handleOnline);
      clearInterval(syncInterval);
      if (channel) void supabase.removeChannel(channel);
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
        // Relire la collection canonique immédiatement : l'admin voit la
        // donnée réellement stockée (ordre, dates et valeurs normalisées),
        // même si l'événement temps réel arrive un peu plus tard.
        await refreshTable(table);
        void logActivity(logAction, describe(item), table, id);
      } catch (err) {
        setter((list) =>
          existing
            ? list.map((i) => (i.id === id ? existing : i))
            : list.filter((i) => i.id !== id)
        );
        void refreshTable(table);
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
      const deletedItem = items.find((i) => i.id === id);
      setter((list) => list.filter((i) => i.id !== id));
      try {
        await deleteRow(table, id);
        await refreshTable(table);
        void logActivity(logAction, `Élément supprimé ID : ${id}`, table, id);
      } catch (err) {
        if (deletedItem) {
          setter((list) => (list.some((i) => i.id === id) ? list : [...list, deletedItem]));
        }
        void refreshTable(table);
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
      await refreshTable(T.SETTINGS);
      void logActivity('MODIFICATION_PARAMÈTRES', 'Mise à jour des informations institutionnelles');
    } catch (err) {
      setSettings(prev);
      void refreshTable(T.SETTINGS);
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

  const deleteMedia = async (id: string) => {
    const sb = requireSupabase();
    const item = media.find((m) => m.id === id);
    const catalogItem = Object.values(SITE_MEDIA_CATALOG).find(
      (m) => m.id === id || (item?.location && m.location === item.location)
    );

    // La médiathèque affiche aussi les emplacements d'images livrés avec le
    // site. S'il n'existe aucune surcharge Supabase pour cet emplacement,
    // il n'y a rien à supprimer en base : on l'explique au lieu d'annoncer
    // une suppression qui réapparaîtrait au rechargement suivant.
    const { data: existingRow, error: lookupError } = await sb
      .from(T.MEDIA)
      .select('id')
      .eq('id', id)
      .maybeSingle();
    if (lookupError) throw new Error(describeSupabaseError(lookupError));
    if (!existingRow) {
      await refreshTable(T.MEDIA);
      throw new Error(
        catalogItem
          ? 'Cet emplacement fait partie des images intégrées au site et n’a aucune surcharge Supabase à supprimer. Pour le modifier, remplacez son image/URL puis enregistrez.'
          : 'Ce média n’existe plus dans Supabase. La médiathèque vient d’être resynchronisée.'
      );
    }

    setMedia((list) => list.filter((m) => m.id !== id));
    try {
      await deleteRow(T.MEDIA, id);
      // Si c'était une surcharge d'un emplacement intégré, `loadMedia`
      // restaure l'image d'origine depuis le catalogue du site.
      await refreshTable(T.MEDIA);
      void logActivity('SUPPRESSION_MÉDIA', `Élément supprimé ID : ${id}`, T.MEDIA, id);
    } catch (err) {
      void refreshTable(T.MEDIA);
      throw err;
    }
  };

  const savePage = async (item: Partial<PageContent>) => {
    const existing = Object.values(pages).find((p) => p.id === item.id || (item.slug && p.slug === item.slug));
    const id = item.id || existing?.id || `page-${item.slug || Date.now()}`;
    const payload = { ...existing, ...item, id, updatedAt: new Date().toISOString() } as PageContent;
    const prev = pages;
    setPages((p) => {
      const next = { ...p };
      if (existing?.slug && existing.slug !== payload.slug) delete next[existing.slug];
      next[payload.slug || id] = payload;
      return next;
    });
    try {
      await upsertRow(T.PAGES, pageToRow(payload));
      await refreshTable(T.PAGES);
      void logActivity('MODIFICATION_PAGE', `Page modifiée : ${payload.name || payload.title}`, 'pages', id);
    } catch (err) {
      setPages(prev);
      void refreshTable(T.PAGES);
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
    const { data, error: uError } = await sb.from(T.QUOTES).update(updates).eq('id', id).select('id');
    if (uError) {
      setQuotes(prev);
      void refreshTable(T.QUOTES);
      throw new Error(describeSupabaseError(uError));
    }
    try {
      assertRowsAffected(data, 'Mise à jour du statut', T.QUOTES);
    } catch (err) {
      setQuotes(prev);
      void refreshTable(T.QUOTES);
      throw err;
    }
    await refreshTable(T.QUOTES);
    void logActivity('MISE_A_JOUR_DEVIS', `Statut devis ${id} → ${status}`, 'quotes', id);
  };

  const updateMessageStatus = async (id: string, status: ContactMessage['status'], notes?: string) => {
    const sb = requireSupabase();
    const updates: Record<string, any> = { status };
    if (notes !== undefined) updates.notes = notes;
    const prev = contactMessages;
    setContactMessages((list) => list.map((m) => (m.id === id ? { ...m, status, ...(notes !== undefined ? { notes } : {}) } : m)));
    const { data, error: uError } = await sb
      .from(T.CONTACT_MESSAGES)
      .update(updates)
      .eq('id', id)
      .select('id');
    if (uError) {
      setContactMessages(prev);
      void refreshTable(T.CONTACT_MESSAGES);
      throw new Error(describeSupabaseError(uError));
    }
    try {
      assertRowsAffected(data, 'Mise à jour du statut', T.CONTACT_MESSAGES);
    } catch (err) {
      setContactMessages(prev);
      void refreshTable(T.CONTACT_MESSAGES);
      throw err;
    }
    await refreshTable(T.CONTACT_MESSAGES);
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
        realtimeStatus,
        lastSyncedAt,
        isSyncing,
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
