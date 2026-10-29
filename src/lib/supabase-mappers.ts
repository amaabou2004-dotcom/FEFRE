import type {
  ActivityLog,
  ArticleItem,
  ContactMessage,
  FAQItem,
  MediaItem,
  PageContent,
  PartnerDocument,
  PartnerItem,
  PartnerProject,
  ProjectItem,
  QuoteRequest,
  SectorItem,
  ServiceItem,
  SiteSettings,
  TestimonialItem,
} from '../types';

/**
 * Convertisseurs lignes PostgreSQL (snake_case) ⇄ objets du site (camelCase).
 * Chaque table Supabase a de vraies colonnes (visibles/editables dans le
 * Table Editor Supabase) ; ces fonctions font la traduction dans les 2 sens.
 * Les champs `undefined` sont retirés avant l'écriture pour ne pas écraser
 * les valeurs existantes lors d'un upsert partiel.
 */

type Row = Record<string, any>;

function clean<T extends Row>(obj: T): T {
  const out: Row = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}

const arr = (v: any): string[] => (Array.isArray(v) ? v : []);

/* ------------------------------------------------------------------ */
/* Paramètres du site (ligne unique, id = 'general')                   */
/* ------------------------------------------------------------------ */

export function settingsFromRow(row: Row, fallback: SiteSettings): SiteSettings {
  return {
    ...fallback,
    name: row.name ?? fallback.name,
    shortName: row.short_name ?? fallback.shortName,
    location: row.location ?? fallback.location,
    country: row.country ?? fallback.country,
    email: row.email ?? fallback.email,
    whatsapp: row.whatsapp ?? fallback.whatsapp,
    whatsappRaw: row.whatsapp_raw ?? fallback.whatsappRaw,
    phones: Array.isArray(row.phones) ? row.phones : fallback.phones,
    workingHours: row.working_hours ?? fallback.workingHours,
    nif: row.nif ?? fallback.nif,
    rccm: row.rccm ?? fallback.rccm,
    defaultWhatsAppMessage: row.default_whatsapp_message ?? fallback.defaultWhatsAppMessage,
    tagline: row.tagline ?? fallback.tagline,
    heroSubtitle: row.hero_subtitle ?? fallback.heroSubtitle,
    mission: row.mission ?? fallback.mission,
    aboutText: row.about_text ?? fallback.aboutText,
    values: Array.isArray(row.company_values) ? row.company_values : fallback.values,
    shopStatus: row.shop_status ?? fallback.shopStatus,
    shopNotice: row.shop_notice ?? fallback.shopNotice,
    seoDefaultTitle: row.seo_default_title ?? fallback.seoDefaultTitle,
    seoDefaultDescription: row.seo_default_description ?? fallback.seoDefaultDescription,
    facebook: row.facebook ?? fallback.facebook,
    tiktok: row.tiktok ?? fallback.tiktok,
    updatedAt: row.updated_at ?? undefined,
  };
}

export function settingsToRow(s: SiteSettings): Row {
  return clean({
    id: 'general',
    name: s.name,
    short_name: s.shortName,
    location: s.location,
    country: s.country,
    email: s.email,
    whatsapp: s.whatsapp,
    whatsapp_raw: s.whatsappRaw,
    phones: s.phones,
    working_hours: s.workingHours,
    nif: s.nif,
    rccm: s.rccm,
    default_whatsapp_message: s.defaultWhatsAppMessage,
    tagline: s.tagline,
    hero_subtitle: s.heroSubtitle,
    mission: s.mission,
    about_text: s.aboutText,
    company_values: s.values,
    shop_status: s.shopStatus,
    shop_notice: s.shopNotice,
    seo_default_title: s.seoDefaultTitle,
    seo_default_description: s.seoDefaultDescription,
    facebook: s.facebook,
    tiktok: s.tiktok,
  });
}

/* ------------------------------------------------------------------ */
/* Services / Secteurs / Témoignages / FAQ                             */
/* ------------------------------------------------------------------ */

export const serviceFromRow = (r: Row): ServiceItem => ({
  id: r.id,
  number: r.number ?? '',
  title: r.title ?? '',
  slug: r.slug ?? '',
  positioning: r.positioning ?? '',
  summary: r.summary ?? '',
  iconName: r.icon_name ?? 'Briefcase',
  prestations: arr(r.prestations),
  status: r.status ?? 'active',
  displayOrder: r.display_order ?? undefined,
  updatedAt: r.updated_at ?? undefined,
});

export const serviceToRow = (s: ServiceItem): Row =>
  clean({
    id: s.id,
    number: s.number,
    title: s.title,
    slug: s.slug,
    positioning: s.positioning,
    summary: s.summary,
    icon_name: s.iconName,
    prestations: s.prestations ?? [],
    status: s.status ?? 'active',
    display_order: s.displayOrder,
  });

export const sectorFromRow = (r: Row): SectorItem => ({
  id: r.id,
  name: r.name ?? '',
  slug: r.slug ?? '',
  iconName: r.icon_name ?? 'Layers',
  description: r.description ?? '',
  features: arr(r.features),
  status: r.status ?? 'active',
  displayOrder: r.display_order ?? undefined,
  updatedAt: r.updated_at ?? undefined,
});

export const sectorToRow = (s: SectorItem): Row =>
  clean({
    id: s.id,
    name: s.name,
    slug: s.slug,
    icon_name: s.iconName,
    description: s.description,
    features: s.features ?? [],
    status: s.status ?? 'active',
    display_order: s.displayOrder,
  });

export const testimonialFromRow = (r: Row): TestimonialItem => ({
  id: r.id,
  quote: r.quote ?? '',
  author: r.author ?? '',
  role: r.author_role ?? undefined,
  company: r.company ?? undefined,
  rating: r.rating ?? undefined,
  avatarUrl: r.avatar_url ?? undefined,
  status: r.status ?? 'published',
  displayOrder: r.display_order ?? undefined,
  updatedAt: r.updated_at ?? undefined,
});

export const testimonialToRow = (t: TestimonialItem): Row =>
  clean({
    id: t.id,
    quote: t.quote,
    author: t.author,
    author_role: t.role,
    company: t.company,
    rating: t.rating,
    avatar_url: t.avatarUrl,
    status: t.status ?? 'published',
    display_order: t.displayOrder,
  });

export const faqFromRow = (r: Row): FAQItem => ({
  id: r.id,
  question: r.question ?? '',
  answer: r.answer ?? '',
  category: r.category ?? 'Général',
  displayOrder: r.display_order ?? 0,
  status: r.status ?? 'published',
  updatedAt: r.updated_at ?? undefined,
});

export const faqToRow = (f: FAQItem): Row =>
  clean({
    id: f.id,
    question: f.question,
    answer: f.answer,
    category: f.category,
    display_order: f.displayOrder ?? 0,
    status: f.status ?? 'published',
  });

/* ------------------------------------------------------------------ */
/* Pages / Médias / Articles                                           */
/* ------------------------------------------------------------------ */

export const pageFromRow = (r: Row): PageContent => ({
  id: r.id,
  slug: r.slug ?? '',
  name: r.name ?? '',
  title: r.title ?? '',
  subtitle: r.subtitle ?? '',
  content: r.content ?? '',
  ctaText: r.cta_text ?? '',
  ctaLink: r.cta_link ?? '',
  seoTitle: r.seo_title ?? '',
  seoDescription: r.seo_description ?? '',
  updatedAt: r.updated_at ?? undefined,
});

export const pageToRow = (p: PageContent): Row =>
  clean({
    id: p.id,
    slug: p.slug,
    name: p.name,
    title: p.title,
    subtitle: p.subtitle,
    content: p.content,
    cta_text: p.ctaText,
    cta_link: p.ctaLink,
    seo_title: p.seoTitle,
    seo_description: p.seoDescription,
  });

export const mediaFromRow = (r: Row): MediaItem => ({
  id: r.id,
  name: r.name ?? '',
  description: r.description ?? undefined,
  location: r.location ?? undefined,
  url: r.url ?? '',
  mobileUrl: r.mobile_url ?? undefined,
  srcSet: r.src_set ?? undefined,
  alt: r.alt ?? '',
  category: r.category ?? undefined,
  aspectRatio: r.aspect_ratio ?? undefined,
  priority: r.priority ?? undefined,
  updatedAt: r.updated_at ?? undefined,
});

export const mediaToRow = (m: MediaItem): Row =>
  clean({
    id: m.id,
    name: m.name,
    description: m.description,
    location: m.location,
    url: m.url,
    mobile_url: m.mobileUrl,
    src_set: m.srcSet,
    alt: m.alt,
    category: m.category,
    aspect_ratio: m.aspectRatio,
    priority: m.priority ?? false,
  });

export const articleFromRow = (r: Row): ArticleItem => ({
  id: r.id,
  title: r.title ?? '',
  slug: r.slug ?? '',
  category: r.category ?? '',
  summary: r.summary ?? '',
  content: r.content ?? '',
  date: r.date ?? '',
  readTime: r.read_time ?? '',
  imageUrl: r.image_url ?? '',
  imageMobileUrl: r.image_mobile_url ?? undefined,
  srcSet: r.src_set ?? undefined,
  author: r.author ?? '',
  authorRole: r.author_role ?? '',
  tags: arr(r.tags),
  status: r.status ?? 'published',
  displayOrder: r.display_order ?? undefined,
});

export const articleToRow = (a: ArticleItem): Row =>
  clean({
    id: a.id,
    title: a.title,
    slug: a.slug,
    category: a.category,
    summary: a.summary,
    content: a.content,
    date: a.date,
    read_time: a.readTime,
    image_url: a.imageUrl,
    image_mobile_url: a.imageMobileUrl,
    src_set: a.srcSet,
    author: a.author,
    author_role: a.authorRole,
    tags: a.tags ?? [],
    status: a.status ?? 'published',
    display_order: a.displayOrder,
  });

/* ------------------------------------------------------------------ */
/* Partenaires / Projets / Espace partenaire                           */
/* ------------------------------------------------------------------ */

export const partnerFromRow = (r: Row): PartnerItem => ({
  id: r.id,
  name: r.name ?? '',
  category: r.category ?? '',
  logoUrl: r.logo_url ?? undefined,
  description: r.description ?? undefined,
  website: r.website ?? undefined,
  partnershipType: r.partnership_type ?? undefined,
  status: r.status ?? 'active',
  displayOrder: r.display_order ?? undefined,
  updatedAt: r.updated_at ?? undefined,
});

export const partnerToRow = (p: PartnerItem): Row =>
  clean({
    id: p.id,
    name: p.name,
    category: p.category,
    logo_url: p.logoUrl,
    description: p.description,
    website: p.website,
    partnership_type: p.partnershipType,
    status: p.status ?? 'active',
    display_order: p.displayOrder,
  });

export const projectFromRow = (r: Row): ProjectItem => ({
  id: r.id,
  title: r.title ?? '',
  slug: r.slug ?? undefined,
  category: r.category ?? '',
  client: r.client ?? undefined,
  summary: r.summary ?? '',
  deliverables: arr(r.deliverables),
  results: arr(r.results),
  imageUrl: r.image_url ?? undefined,
  date: r.date ?? undefined,
  status: r.status ?? 'standard',
  displayOrder: r.display_order ?? undefined,
  updatedAt: r.updated_at ?? undefined,
});

export const projectToRow = (p: ProjectItem): Row =>
  clean({
    id: p.id,
    title: p.title,
    slug: p.slug,
    category: p.category,
    client: p.client,
    summary: p.summary,
    deliverables: p.deliverables ?? [],
    results: p.results ?? [],
    image_url: p.imageUrl,
    date: p.date,
    status: p.status ?? 'standard',
    display_order: p.displayOrder,
  });

export const partnerProjectFromRow = (r: Row): PartnerProject => ({
  id: r.id,
  title: r.title ?? '',
  partnerId: r.partner_id ?? '',
  partnerName: r.partner_name ?? '',
  status: r.status ?? 'pending',
  startDate: r.start_date ?? '',
  progress: r.progress ?? 0,
  description: r.description ?? '',
  keyDeliverables: arr(r.key_deliverables),
});

export const partnerProjectToRow = (p: PartnerProject): Row =>
  clean({
    id: p.id,
    title: p.title,
    partner_id: p.partnerId,
    partner_name: p.partnerName,
    status: p.status,
    start_date: p.startDate,
    progress: p.progress,
    description: p.description,
    key_deliverables: p.keyDeliverables ?? [],
  });

export const partnerDocumentFromRow = (r: Row): PartnerDocument => ({
  id: r.id,
  title: r.title ?? '',
  partnerId: r.partner_id ?? '',
  type: r.type ?? '',
  fileSize: r.file_size ?? '',
  uploadDate: r.upload_date ?? '',
  url: r.url ?? undefined,
});

export const partnerDocumentToRow = (d: PartnerDocument): Row =>
  clean({
    id: d.id,
    title: d.title,
    partner_id: d.partnerId,
    type: d.type,
    file_size: d.fileSize,
    upload_date: d.uploadDate,
    url: d.url,
  });

/* ------------------------------------------------------------------ */
/* Devis / Messages de contact / Journal d'activité                    */
/* ------------------------------------------------------------------ */

/**
 * Le formulaire de devis envoie des champs "legacy" (service, sector,
 * description, budget, firstName/lastName…) : on les normalise vers les
 * colonnes canoniques, et on ré-expose les alias à la lecture pour que
 * l'ancien code d'affichage continue de fonctionner.
 */
export function normalizeQuoteInput(q: Row): Row {
  const fullName =
    q.fullName ||
    `${q.firstName || ''} ${q.lastName || ''}`.trim() ||
    'Prospect';
  return {
    full_name: fullName,
    first_name: q.firstName || null,
    last_name: q.lastName || null,
    company: q.company || null,
    email: q.email || '',
    phone: q.phone || '',
    whatsapp: q.whatsapp || null,
    service_interest: q.serviceInterest || q.service || '',
    sector: q.sector || null,
    budget_range: q.budgetRange || q.budget || null,
    timeline: q.timeline || null,
    details: q.details || q.description || '',
    file_name: q.fileName || null,
    status: 'new',
  };
}

export const quoteFromRow = (r: Row): QuoteRequest => {
  const base: QuoteRequest = {
    id: r.id,
    fullName: r.full_name ?? '',
    firstName: r.first_name ?? undefined,
    lastName: r.last_name ?? undefined,
    company: r.company ?? '',
    email: r.email ?? '',
    phone: r.phone ?? '',
    whatsapp: r.whatsapp ?? undefined,
    serviceInterest: r.service_interest ?? '',
    sector: r.sector ?? undefined,
    budgetRange: r.budget_range ?? undefined,
    timeline: r.timeline ?? undefined,
    details: r.details ?? '',
    fileName: r.file_name ?? undefined,
    status: r.status ?? 'new',
    adminNotes: r.admin_notes ?? undefined,
    createdAt: r.created_at ?? '',
  };
  // Alias legacy utilisés par d'anciens écrans d'affichage.
  (base as any).service = base.serviceInterest;
  (base as any).description = base.details;
  (base as any).budget = base.budgetRange;
  return base;
};

export const ContactMessageFromRow = (r: Row): ContactMessage => ({
  id: r.id,
  fullName: r.full_name ?? '',
  company: r.company ?? undefined,
  email: r.email ?? '',
  phone: r.phone ?? undefined,
  subject: r.subject ?? '',
  message: r.message ?? '',
  status: r.status === 'new' ? 'unread' : (r.status ?? 'unread'),
  notes: r.notes ?? undefined,
  createdAt: r.created_at ?? '',
});

export const activityLogFromRow = (r: Row): ActivityLog => ({
  id: r.id,
  timestamp: r.created_at ?? '',
  action: r.action ?? '',
  actor: r.actor ?? '',
  details: r.details ?? '',
  type: r.type ?? 'update',
});
