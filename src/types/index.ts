export type ThemeMode = 'light' | 'dark';

export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  slug: string;
  positioning: string;
  summary: string;
  iconName: string;
  prestations: string[];
  status?: 'active' | 'draft' | 'hidden';
  displayOrder?: number;
  updatedAt?: string;
}

export interface SectorItem {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  description: string;
  features: string[];
  status?: 'active' | 'draft' | 'hidden';
  displayOrder?: number;
  updatedAt?: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role?: string;
  company?: string;
  rating?: number;
  avatarUrl?: string;
  status?: 'published' | 'pending';
  displayOrder?: number;
  updatedAt?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  status: 'published' | 'draft';
  updatedAt?: string;
}

export interface PageContent {
  id: string;
  slug: string;
  name: string;
  title: string;
  subtitle: string;
  content: string;
  ctaText: string;
  ctaLink: string;
  seoTitle: string;
  seoDescription: string;
  updatedAt?: string;
}

export interface MediaItem {
  id: string;
  name: string;
  description?: string;
  location?: string;
  url: string;
  mobileUrl?: string;
  srcSet?: string;
  alt: string;
  category?: string;
  aspectRatio?: string;
  priority?: boolean;
  updatedAt?: string;
}

export interface QuoteRequest {
  id: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  company: string;
  email: string;
  phone: string;
  whatsapp?: string;
  serviceInterest: string;
  sector?: string;
  budgetRange?: string;
  timeline?: string;
  details: string;
  fileName?: string;
  status: 'new' | 'in_review' | 'contacted' | 'completed' | 'archived';
  adminNotes?: string;
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  fullName: string;
  company?: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'archived';
  notes?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  type?: 'create' | 'update' | 'delete' | 'auth';
}

export interface PartnerItem {
  id: string;
  name: string;
  category: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  partnershipType?: string;
  status: 'active' | 'pending' | 'former';
  displayOrder?: number;
  updatedAt?: string;
}

export interface ProjectItem {
  id: string;
  title: string;
  slug?: string;
  category: string;
  client?: string;
  summary: string;
  deliverables?: string[];
  results?: string[];
  imageUrl?: string;
  date?: string;
  status: 'featured' | 'standard' | 'upcoming';
  displayOrder?: number;
  updatedAt?: string;
}

export interface ArticleItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  date: string;
  readTime: string;
  imageUrl: string;
  imageMobileUrl?: string;
  srcSet?: string;
  author: string;
  authorRole: string;
  tags?: string[];
  status?: 'published' | 'draft';
  displayOrder?: number;
}

export interface PartnerUser {
  id: string;
  email: string;
  fullName: string;
  company: string;
  token?: string;
}

export interface PartnerProject {
  id: string;
  title: string;
  partnerId: string;
  partnerName: string;
  status: 'in_progress' | 'completed' | 'pending';
  startDate: string;
  progress: number;
  description: string;
  keyDeliverables: string[];
}

export interface PartnerDocument {
  id: string;
  title: string;
  partnerId: string;
  type: string;
  fileSize: string;
  uploadDate: string;
  url?: string;
}

export interface SiteSettings {
  name: string;
  shortName: string;
  location: string;
  country: string;
  email: string;
  whatsapp: string;
  whatsappRaw: string;
  phones: { label: string; number: string; raw: string }[];
  workingHours: string;
  nif: string;
  rccm: string;
  defaultWhatsAppMessage: string;
  tagline: string;
  heroSubtitle: string;
  mission: string;
  aboutText: string;
  values: string[];
  shopStatus: 'in_preparation' | 'open' | 'maintenance';
  shopNotice: string;
  seoDefaultTitle: string;
  seoDefaultDescription: string;
  facebook?: string;
  tiktok?: string;
  updatedAt?: string;
}
