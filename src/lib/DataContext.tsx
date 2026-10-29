import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  updateDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { FIREBASE_COLLECTIONS } from './firebase-schema';
import {
  ServiceItem,
  SectorItem,
  TestimonialItem,
  FAQItem,
  PageContent,
  MediaItem,
  QuoteRequest,
  ContactMessage,
  ActivityLog,
  PartnerItem,
  ProjectItem,
  PartnerUser,
  PartnerProject,
  PartnerDocument,
  SiteSettings,
} from '../types';
import {
  COMPANY_INFO,
  SERVICES,
  SECTORS,
  TESTIMONIALS,
  FAQ_ITEMS,
  DEFAULT_PAGES_CONTENT,
  DEFAULT_PARTNERS,
  DEFAULT_PROJECTS,
} from '../data/company';
import { SITE_MEDIA_CATALOG } from '../data/media';

interface DataContextType {
  settings: SiteSettings;
  services: ServiceItem[];
  sectors: SectorItem[];
  testimonials: TestimonialItem[];
  faqs: FAQItem[];
  pages: Record<string, PageContent>;
  media: MediaItem[];
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
  error: string | null;
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

function handleFirestoreError(err: unknown, operationType: string, path: string) {
  const info = {
    error: err instanceof Error ? err.message : String(err),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(info));
  throw new Error(JSON.stringify(info));
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(COMPANY_INFO);
  const [services, setServices] = useState<ServiceItem[]>(SERVICES);
  const [sectors, setSectors] = useState<SectorItem[]>(SECTORS);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(TESTIMONIALS);
  const [faqs, setFaqs] = useState<FAQItem[]>(FAQ_ITEMS);
  const [pages, setPages] = useState<Record<string, PageContent>>(DEFAULT_PAGES_CONTENT as any);
  const [media, setMedia] = useState<MediaItem[]>(() => Object.values(SITE_MEDIA_CATALOG));
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [partners, setPartners] = useState<PartnerItem[]>(DEFAULT_PARTNERS);
  const [projects, setProjects] = useState<ProjectItem[]>(DEFAULT_PROJECTS);

  const [partnerUser, setPartnerUser] = useState<PartnerUser | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('es_partner_user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [partnerProjects] = useState<PartnerProject[]>([
    {
      id: 'pp-01',
      title: 'Programme d’Accélération Relation Client & CRM',
      partnerId: 'partner-active',
      partnerName: 'Partenaire Institutionnel',
      status: 'in_progress',
      startDate: '2026-02-01',
      progress: 65,
      description: 'Déploiement conjoint d’un centre de contact pilote et intégration des flux de support multicanal.',
      keyDeliverables: [
        'Cartographie des parcours usagers',
        'Paramétrage CRM & canaux digitaux',
        'Formation des téléconseillers à Niamey',
      ],
    },
  ]);

  const [partnerDocuments] = useState<PartnerDocument[]>([
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
  ]);

  const [isLoading, setIsLoading] = useState(true);
  const [isConnectedToCloud, setIsConnectedToCloud] = useState(false);
  const [error] = useState<string | null>(null);

  const logActivity = useCallback(
    async (action: string, details: string, entityType?: string, entityId?: string) => {
      try {
        const entry = {
          action,
          actor: auth.currentUser?.email || 'admin@excellence-services-sarl.com',
          details,
          timestamp: new Date().toISOString(),
          type: 'update',
        };
        await addDoc(collection(db, FIREBASE_COLLECTIONS.ACTIVITY_LOGS), entry);
      } catch (err) {
        console.warn('Could not record activity log:', err);
      }
    },
    []
  );

  const seedDatabaseIfNeeded = useCallback(async () => {
    try {
      const settingsSnap = await getDocs(collection(db, FIREBASE_COLLECTIONS.SETTINGS));
      if (settingsSnap.empty) {
        await setDoc(doc(db, FIREBASE_COLLECTIONS.SETTINGS, 'general'), {
          ...COMPANY_INFO,
          updatedAt: new Date().toISOString(),
        });
      }

      const servicesSnap = await getDocs(collection(db, FIREBASE_COLLECTIONS.SERVICES));
      if (servicesSnap.empty) {
        for (let i = 0; i < SERVICES.length; i++) {
          const item = SERVICES[i];
          await setDoc(doc(db, FIREBASE_COLLECTIONS.SERVICES, item.id), {
            ...item,
            displayOrder: i + 1,
            status: 'active',
            updatedAt: new Date().toISOString(),
          });
        }
      }

      const sectorsSnap = await getDocs(collection(db, FIREBASE_COLLECTIONS.SECTORS));
      if (sectorsSnap.empty) {
        for (let i = 0; i < SECTORS.length; i++) {
          const item = SECTORS[i];
          await setDoc(doc(db, FIREBASE_COLLECTIONS.SECTORS, item.id), {
            ...item,
            displayOrder: i + 1,
            status: 'active',
            updatedAt: new Date().toISOString(),
          });
        }
      }

      const testSnap = await getDocs(collection(db, FIREBASE_COLLECTIONS.TESTIMONIALS));
      if (testSnap.empty) {
        for (let i = 0; i < TESTIMONIALS.length; i++) {
          const item = TESTIMONIALS[i];
          await setDoc(doc(db, FIREBASE_COLLECTIONS.TESTIMONIALS, item.id), {
            ...item,
            displayOrder: i + 1,
            status: 'published',
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('Seed database notice:', err);
    }
  }, []);

  // Real-time Firestore Listeners
  useEffect(() => {
    try {
      // Settings listener
      const unsubSettings = onSnapshot(
        doc(db, FIREBASE_COLLECTIONS.SETTINGS, 'general'),
        (snap) => {
          if (snap.exists()) {
            setSettings((prev) => ({ ...prev, ...(snap.data() as SiteSettings) }));
          }
          setIsConnectedToCloud(true);
        },
        (err) => console.warn('Settings listener note:', err)
      );

      // Services listener
      const unsubServices = onSnapshot(
        collection(db, FIREBASE_COLLECTIONS.SERVICES),
        (snap) => {
          if (!snap.empty) {
            const list: ServiceItem[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
            list.sort((a, b) => ((a as any).displayOrder || 0) - ((b as any).displayOrder || 0));
            setServices(list);
          }
        },
        (err) => console.warn('Services listener note:', err)
      );

      // Sectors listener
      const unsubSectors = onSnapshot(
        collection(db, FIREBASE_COLLECTIONS.SECTORS),
        (snap) => {
          if (!snap.empty) {
            const list: SectorItem[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
            setSectors(list);
          }
        },
        (err) => console.warn('Sectors listener note:', err)
      );

      // Testimonials listener
      const unsubTest = onSnapshot(
        collection(db, FIREBASE_COLLECTIONS.TESTIMONIALS),
        (snap) => {
          if (!snap.empty) {
            const list: TestimonialItem[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
            setTestimonials(list);
          }
        },
        (err) => console.warn('Testimonials listener note:', err)
      );

      // FAQs listener
      const unsubFaqs = onSnapshot(
        collection(db, FIREBASE_COLLECTIONS.FAQS),
        (snap) => {
          if (!snap.empty) {
            const list: FAQItem[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
            setFaqs(list);
          }
        },
        (err) => console.warn('FAQs listener note:', err)
      );

      // Pages listener
      const unsubPages = onSnapshot(
        collection(db, FIREBASE_COLLECTIONS.PAGES),
        (snap) => {
          if (!snap.empty) {
            const map: Record<string, PageContent> = {};
            snap.forEach((d) => {
              const p = { id: d.id, ...(d.data() as any) };
              map[p.slug || d.id] = p;
            });
            setPages((prev) => ({ ...prev, ...map }));
          }
        },
        (err) => console.warn('Pages listener note:', err)
      );

      // Media listener
      const unsubMedia = onSnapshot(
        collection(db, FIREBASE_COLLECTIONS.MEDIA),
        (snap) => {
          if (!snap.empty) {
            const list: MediaItem[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
            // Merge with local site media catalog
            const catalogList = Object.values(SITE_MEDIA_CATALOG);
            const merged = [...catalogList];
            for (const item of list) {
              const idx = merged.findIndex((m) => m.id === item.id || m.location === item.location);
              if (idx >= 0) {
                merged[idx] = item;
              } else {
                merged.push(item);
              }
            }
            setMedia(merged);
          }
        },
        (err) => console.warn('Media listener note:', err)
      );

      // Quotes listener
      const unsubQuotes = onSnapshot(
        collection(db, FIREBASE_COLLECTIONS.QUOTES),
        (snap) => {
          const list: QuoteRequest[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setQuotes(list);
        },
        (err) => console.warn('Quotes listener note:', err)
      );

      // Contact messages listener
      const unsubContact = onSnapshot(
        collection(db, FIREBASE_COLLECTIONS.CONTACT_MESSAGES),
        (snap) => {
          const list: ContactMessage[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setContactMessages(list);
        },
        (err) => console.warn('Contact listener note:', err)
      );

      // Activity logs listener
      const unsubLogs = onSnapshot(
        collection(db, FIREBASE_COLLECTIONS.ACTIVITY_LOGS),
        (snap) => {
          const list: ActivityLog[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
          list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setActivityLogs(list);
        },
        (err) => console.warn('Activity logs listener note:', err)
      );

      // Partners listener
      const unsubPartners = onSnapshot(
        collection(db, FIREBASE_COLLECTIONS.PARTNERS),
        (snap) => {
          const list: PartnerItem[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
          setPartners(list);
        },
        (err) => console.warn('Partners listener note:', err)
      );

      // Projects listener
      const unsubProjects = onSnapshot(
        collection(db, FIREBASE_COLLECTIONS.PROJECTS),
        (snap) => {
          const list: ProjectItem[] = [];
          snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
          setProjects(list);
        },
        (err) => console.warn('Projects listener note:', err)
      );

      setIsLoading(false);

      return () => {
        unsubSettings();
        unsubServices();
        unsubSectors();
        unsubTest();
        unsubFaqs();
        unsubPages();
        unsubMedia();
        unsubQuotes();
        unsubContact();
        unsubLogs();
        unsubPartners();
        unsubProjects();
      };
    } catch (err) {
      console.warn('Firestore initial connection note:', err);
      setIsLoading(false);
    }
  }, []);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    const updated = { ...settings, ...newSettings, updatedAt: new Date().toISOString() };
    setSettings(updated);
    try {
      await setDoc(doc(db, FIREBASE_COLLECTIONS.SETTINGS, 'general'), updated, { merge: true });
      logActivity('MODIFICATION_PARAMÈTRES', 'Mise à jour des informations institutionnelles');
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, 'write', 'site_settings/general');
      }
      throw err;
    }
  };

  const saveService = async (item: Partial<ServiceItem>) => {
    const id = item.id || `service-${Date.now()}`;
    const payload = { ...item, id, updatedAt: new Date().toISOString() };
    setServices((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = payload as ServiceItem;
        return copy;
      }
      return [...prev, payload as ServiceItem];
    });

    try {
      await setDoc(doc(db, FIREBASE_COLLECTIONS.SERVICES, id), payload, { merge: true });
      logActivity('ENREGISTREMENT_SERVICE', `Service enregistré : ${item.title}`, 'service', id);
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, 'write', `services/${id}`);
      }
      throw err;
    }
  };

  const deleteService = async (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteDoc(doc(db, FIREBASE_COLLECTIONS.SERVICES, id));
      logActivity('SUPPRESSION_SERVICE', `Service supprimé ID : ${id}`, 'service', id);
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, 'delete', `services/${id}`);
      }
      throw err;
    }
  };

  const saveSector = async (item: Partial<SectorItem>) => {
    const id = item.id || `sector-${Date.now()}`;
    const payload = { ...item, id, updatedAt: new Date().toISOString() };
    setSectors((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = payload as SectorItem;
        return copy;
      }
      return [...prev, payload as SectorItem];
    });

    try {
      await setDoc(doc(db, FIREBASE_COLLECTIONS.SECTORS, id), payload, { merge: true });
      logActivity('ENREGISTREMENT_SECTEUR', `Secteur enregistré : ${item.name}`, 'sector', id);
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, 'write', `sectors/${id}`);
      }
      throw err;
    }
  };

  const deleteSector = async (id: string) => {
    setSectors((prev) => prev.filter((s) => s.id !== id));
    try {
      await deleteDoc(doc(db, FIREBASE_COLLECTIONS.SECTORS, id));
      logActivity('SUPPRESSION_SECTEUR', `Secteur supprimé ID : ${id}`, 'sector', id);
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, 'delete', `sectors/${id}`);
      }
      throw err;
    }
  };

  const saveTestimonial = async (item: Partial<TestimonialItem>) => {
    const id = item.id || `test-${Date.now()}`;
    const payload = { ...item, id, updatedAt: new Date().toISOString() };
    setTestimonials((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = payload as TestimonialItem;
        return copy;
      }
      return [...prev, payload as TestimonialItem];
    });

    try {
      await setDoc(doc(db, FIREBASE_COLLECTIONS.TESTIMONIALS, id), payload, { merge: true });
      logActivity('ENREGISTREMENT_TÉMOIGNAGE', `Témoignage de : ${item.author}`, 'testimonial', id);
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, 'write', `testimonials/${id}`);
      }
      throw err;
    }
  };

  const deleteTestimonial = async (id: string) => {
    setTestimonials((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteDoc(doc(db, FIREBASE_COLLECTIONS.TESTIMONIALS, id));
      logActivity('SUPPRESSION_TÉMOIGNAGE', `Témoignage supprimé ID : ${id}`, 'testimonial', id);
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, 'delete', `testimonials/${id}`);
      }
      throw err;
    }
  };

  const saveFAQ = async (item: Partial<FAQItem>) => {
    const id = item.id || `faq-${Date.now()}`;
    const payload = { ...item, id, updatedAt: new Date().toISOString() };
    setFaqs((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = payload as FAQItem;
        return copy;
      }
      return [...prev, payload as FAQItem];
    });

    try {
      await setDoc(doc(db, FIREBASE_COLLECTIONS.FAQS, id), payload, { merge: true });
      logActivity('ENREGISTREMENT_FAQ', `Question FAQ : ${item.question?.slice(0, 30)}...`, 'faq', id);
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, 'write', `faqs/${id}`);
      }
      throw err;
    }
  };

  const deleteFAQ = async (id: string) => {
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    try {
      await deleteDoc(doc(db, FIREBASE_COLLECTIONS.FAQS, id));
      logActivity('SUPPRESSION_FAQ', `FAQ supprimée ID : ${id}`, 'faq', id);
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, 'delete', `faqs/${id}`);
      }
      throw err;
    }
  };

  const savePartner = async (item: Partial<PartnerItem>) => {
    const id = item.id || `partner-${Date.now()}`;
    const payload = { ...item, id, updatedAt: new Date().toISOString() };
    setPartners((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = payload as PartnerItem;
        return copy;
      }
      return [...prev, payload as PartnerItem];
    });

    try {
      await setDoc(doc(db, FIREBASE_COLLECTIONS.PARTNERS, id), payload, { merge: true });
      logActivity('ENREGISTREMENT_PARTENAIRE', `Partenaire : ${item.name}`, 'partner', id);
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, 'write', `partners/${id}`);
      }
      throw err;
    }
  };

  const deletePartner = async (id: string) => {
    setPartners((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteDoc(doc(db, FIREBASE_COLLECTIONS.PARTNERS, id));
      logActivity('SUPPRESSION_PARTENAIRE', `Partenaire supprimé ID : ${id}`, 'partner', id);
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, 'delete', `partners/${id}`);
      }
      throw err;
    }
  };

  const saveProject = async (item: Partial<ProjectItem>) => {
    const id = item.id || `proj-${Date.now()}`;
    const payload = { ...item, id, updatedAt: new Date().toISOString() };
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = payload as ProjectItem;
        return copy;
      }
      return [...prev, payload as ProjectItem];
    });

    try {
      await setDoc(doc(db, FIREBASE_COLLECTIONS.PROJECTS, id), payload, { merge: true });
      logActivity('ENREGISTREMENT_RÉALISATION', `Projet : ${item.title}`, 'project', id);
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, 'write', `projects/${id}`);
      }
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    try {
      await deleteDoc(doc(db, FIREBASE_COLLECTIONS.PROJECTS, id));
      logActivity('SUPPRESSION_RÉALISATION', `Projet supprimé ID : ${id}`, 'project', id);
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, 'delete', `projects/${id}`);
      }
      throw err;
    }
  };

  const loginPartner = async (emailInput: string) => {
    const email = emailInput.trim().toLowerCase();
    if (!email) {
      return { success: false, error: 'Veuillez saisir votre adresse e-mail.' };
    }
    const user: PartnerUser = {
      id: `usr-${Date.now()}`,
      fullName: email.split('@')[0].toUpperCase(),
      company: 'Partenaire Accrédité',
      email,
    };
    setPartnerUser(user);
    localStorage.setItem('es_partner_user', JSON.stringify(user));
    logActivity('CONNEXION_ESPACE_PARTENAIRE', `Accès portail partenaire : ${email}`);
    return { success: true };
  };

  const logoutPartner = () => {
    setPartnerUser(null);
    localStorage.removeItem('es_partner_user');
  };

  const savePage = async (item: Partial<PageContent>) => {
    const id = item.id || `page-${item.slug || Date.now()}`;
    const payload = { ...item, id, updatedAt: new Date().toISOString() };
    setPages((prev) => ({ ...prev, [item.slug || id]: payload as PageContent }));

    try {
      await setDoc(doc(db, FIREBASE_COLLECTIONS.PAGES, id), payload, { merge: true });
      logActivity('MODIFICATION_PAGE', `Page modifiée : ${item.name || item.title}`, 'page', id);
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, 'write', `pages/${id}`);
      }
      throw err;
    }
  };

  const saveMedia = async (item: Partial<MediaItem>) => {
    const id = item.id || `media-${Date.now()}`;
    const payload = { ...item, id };
    setMedia((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = payload as MediaItem;
        return copy;
      }
      return [...prev, payload as MediaItem];
    });

    try {
      await setDoc(doc(db, FIREBASE_COLLECTIONS.MEDIA, id), payload, { merge: true });
      logActivity('AJOUT_MÉDIA', `Média ajouté : ${item.name}`, 'media', id);
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, 'write', `media/${id}`);
      }
      throw err;
    }
  };

  const deleteMedia = async (id: string) => {
    setMedia((prev) => prev.filter((m) => m.id !== id));
    try {
      await deleteDoc(doc(db, FIREBASE_COLLECTIONS.MEDIA, id));
      logActivity('SUPPRESSION_MÉDIA', `Média supprimé ID : ${id}`, 'media', id);
    } catch (err: any) {
      if (err?.code === 'permission-denied' || err?.message?.includes('Missing or insufficient permissions')) {
        handleFirestoreError(err, 'delete', `media/${id}`);
      }
      throw err;
    }
  };

  const submitQuote = async (quote: Partial<QuoteRequest>) => {
    try {
      const res = await addDoc(collection(db, FIREBASE_COLLECTIONS.QUOTES), {
        ...quote,
        createdAt: new Date().toISOString(),
        status: 'new',
      });
      return { success: true, id: res.id };
    } catch (err: any) {
      console.error('Failed to submit quote to Firestore:', err);
      return { success: false, error: err?.message || 'Erreur lors de l’enregistrement' };
    }
  };

  const submitContactMessage = async (msg: Partial<ContactMessage>) => {
    try {
      const res = await addDoc(collection(db, FIREBASE_COLLECTIONS.CONTACT_MESSAGES), {
        ...msg,
        createdAt: new Date().toISOString(),
        status: 'new',
      });
      return { success: true, id: res.id };
    } catch (err: any) {
      console.error('Failed to submit contact message to Firestore:', err);
      return { success: false, error: err?.message || 'Erreur lors de l’envoi' };
    }
  };

  const updateQuoteStatus = async (id: string, status: QuoteRequest['status'], adminNotes?: string) => {
    try {
      const updates: any = { status };
      if (adminNotes !== undefined) updates.adminNotes = adminNotes;
      await updateDoc(doc(db, FIREBASE_COLLECTIONS.QUOTES, id), updates);
      logActivity('MISE_A_JOUR_DEVIS', `Statut devis ID ${id} passé à ${status}`, 'quote', id);
    } catch (err) {
      console.error('Failed to update quote status:', err);
      throw err;
    }
  };

  const updateMessageStatus = async (id: string, status: ContactMessage['status'], notes?: string) => {
    try {
      const updates: any = { status };
      if (notes !== undefined) updates.notes = notes;
      await updateDoc(doc(db, FIREBASE_COLLECTIONS.CONTACT_MESSAGES, id), updates);
      logActivity('MISE_A_JOUR_MESSAGE', `Statut message ID ${id} passé à ${status}`, 'contact', id);
    } catch (err) {
      console.error('Failed to update message status:', err);
      throw err;
    }
  };

  const deleteQuote = async (id: string) => {
    try {
      await deleteDoc(doc(db, FIREBASE_COLLECTIONS.QUOTES, id));
      logActivity('SUPPRESSION_DEVIS', `Devis supprimé ID ${id}`, 'quote', id);
    } catch (err) {
      console.error('Failed to delete quote:', err);
      throw err;
    }
  };

  const deleteContactMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, FIREBASE_COLLECTIONS.CONTACT_MESSAGES, id));
      logActivity('SUPPRESSION_MESSAGE', `Message supprimé ID ${id}`, 'contact', id);
    } catch (err) {
      console.error('Failed to delete contact message:', err);
      throw err;
    }
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
        error,
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
        resetToDefaults: seedDatabaseIfNeeded,
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
