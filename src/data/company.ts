import { ServiceItem, SectorItem, TestimonialItem, FAQItem, SiteSettings, PartnerItem, ProjectItem } from '../types';
import { LOCAL_IMAGES } from './images';

export const COMPANY_INFO: SiteSettings = {
  name: "EXCELLENCE SERVICES SARL",
  shortName: "Excellence Services",
  location: "Niamey, Niger",
  country: "Niger",
  email: "admin@excellence-services-sarl.com",
  whatsapp: "+227 78 79 89 00",
  whatsappRaw: "22778798900",
  phones: [
    { label: "Ligne Principale / Commercial", number: "+227 78 79 89 00", raw: "22778798900" },
    { label: "Support & Relations Entreprises", number: "+227 90 39 31 32", raw: "22790393132" },
    { label: "Standard Institutionnel", number: "+227 88 08 00 00", raw: "22788080000" },
  ],
  workingHours: "Lundi – Vendredi : 09h30 – 17h30",
  nif: "155632/R",
  rccm: "NE/NIM/01/2026/B12/00018 DU 13/01/2026",
  defaultWhatsAppMessage: "Bonjour Excellence Services SARL, je souhaite obtenir des informations concernant vos services.",
  tagline: "Transformons votre relation client en moteur de croissance.",
  heroSubtitle: "Excellence Services SARL accompagne les entreprises dans leur relation client, leur transformation numérique, leur développement commercial et leur expérience digitale.",
  mission: "Transformer la relation client en un véritable levier de croissance en combinant expertise humaine, outils technologiques et bonnes pratiques professionnelles.",
  aboutText: "Excellence Services SARL accompagne les organisations de toute taille dans l’optimisation de leur expérience client, le développement de solutions digitales performantes et la mise en place de stratégies innovantes pour renforcer leur compétitivité.",
  values: ["Excellence", "Technologie", "Innovation", "Confiance", "Performance", "Croissance"],
  shopStatus: "in_preparation",
  shopNotice: "Notre boutique officielle et catalogue d'équipements spécialisés est actuellement en préparation.",
  seoDefaultTitle: "EXCELLENCE SERVICES SARL — Centre de Contact & Digitalisation au Niger",
  seoDefaultDescription: "Excellence Services SARL : Relation client, centres d'appels, solutions CRM et développement web/mobile à Niamey, Niger.",
  facebook: "https://www.facebook.com/share/18nx1djJnt/?mibextid=wwXIfr",
  tiktok: "https://www.tiktok.com/@excellenceservices?_r=1&_t=ZS-99nADDdMPcS",
};

export const SERVICES: ServiceItem[] = [
  {
    id: "service-01",
    number: "01",
    title: "Centres de Contact & Relation Client",
    slug: "centres-de-contact-relation-client",
    positioning: "Cœur métier – Opérations & performance relationnelle.",
    summary: "Gestion externalisée, support multicanal et excellence opérationnelle pour valoriser chaque interaction client.",
    iconName: "Headphones",
    prestations: [
      "Gestion externalisée des centres d’appels",
      "Support client multicanal",
      "Email",
      "Chat",
      "Réseaux sociaux",
      "Gestion des réclamations",
      "Programmes de fidélisation",
      "Enquêtes de satisfaction",
      "Mesure de l’expérience client",
      "Formation en relation client",
      "Excellence opérationnelle"
    ]
  },
  {
    id: "service-02",
    number: "02",
    title: "Solutions CRM & Technologies de la Relation Client",
    slug: "solutions-crm",
    positioning: "Outils, automatisation et digitalisation des interactions.",
    summary: "Centralisation, automatisation et intégration poussée des données clients pour des parcours sans friction.",
    iconName: "Database",
    prestations: [
      "Solutions CRM sur mesure",
      "Implémentation de solutions technologiques",
      "Logiciels CRM",
      "Automatisation",
      "Intégration des canaux digitaux",
      "Développement de services à valeur ajoutée"
    ]
  },
  {
    id: "service-03",
    number: "03",
    title: "Conseil, Audit & Stratégie Client",
    slug: "conseil-audit-strategie",
    positioning: "Pilotage, structuration et amélioration continue.",
    summary: "Diagnostics précis, cartographies de parcours et recommandations d'experts pour une fidélisation durable.",
    iconName: "Compass",
    prestations: [
      "Audit",
      "Conseil en stratégies CRM",
      "Diagnostic de la gestion de la relation client",
      "Diagnostic de l’expérience client",
      "Conception de parcours clients",
      "Optimisation des processus",
      "Recommandations stratégiques",
      "Fidélisation"
    ]
  },
  {
    id: "service-04",
    number: "04",
    title: "Digital, Web & Applications",
    slug: "digital-web-applications",
    positioning: "Présence digitale et outils métiers.",
    summary: "Conception et ingénierie de plateformes web et mobiles haute performance orientées conversion et expérience utilisateur.",
    iconName: "Code2",
    prestations: [
      "Développement de sites web",
      "Développement de sites mobiles",
      "Applications web",
      "Applications mobiles",
      "Plateformes digitales orientées client",
      "Accompagnement digital"
    ]
  },
  {
    id: "service-05",
    number: "05",
    title: "Développement Commercial & Représentation",
    slug: "developpement-commercial",
    positioning: "Croissance, partenariats et expansion marché.",
    summary: "Accélération commerciale structurée, valorisation de vos offres et conquête active de nouveaux marchés.",
    iconName: "TrendingUp",
    prestations: [
      "Représentation commerciale",
      "Développement de services à valeur ajoutée",
      "Mise en marché de solutions innovantes"
    ]
  },
  {
    id: "service-06",
    number: "06",
    title: "Transformation Numérique des Entreprises",
    slug: "transformation-numerique",
    positioning: "Accompagnement global et changement organisationnel.",
    summary: "Modernisation des processus métiers et conduite du changement axée sur l'humain et les technologies.",
    iconName: "Cpu",
    prestations: [
      "Accompagnement dans la transformation numérique",
      "Intégration du digital dans les processus métiers",
      "Conduite du changement",
      "Approche orientée client et collaborateurs"
    ]
  },
  {
    id: "service-07",
    number: "07",
    title: "Innovation & Expérience Client Avancée",
    slug: "innovation-experience-client",
    positioning: "Différenciation et excellence durable.",
    summary: "Création de valeur mesurable grâce à des approches avant-gardistes et une satisfaction client décuplée.",
    iconName: "Sparkles",
    prestations: [
      "Innovation orientée expérience client",
      "Solutions sur mesure",
      "Satisfaction client",
      "Rétention client",
      "Création de valeur"
    ]
  },
  {
    id: "service-08",
    number: "08",
    title: "E-commerce & Plateformes de Vente",
    slug: "e-commerce",
    positioning: "Monétisation digitale et performance commerciale.",
    summary: "Boutiques en ligne optimisées, intégrations de passerelles et réduction des abandons de paniers.",
    iconName: "ShoppingBag",
    prestations: [
      "Plateformes de vente en ligne",
      "Solutions e-commerce",
      "Gestion de solutions e-shop",
      "Optimisation de l’expérience utilisateur",
      "Optimisation du tunnel de vente"
    ]
  }
];

export const SECTORS: SectorItem[] = [
  {
    id: "assurances",
    name: "Assurances",
    slug: "assurances",
    iconName: "ShieldCheck",
    description: "Modernisation des relations adhérents, automatisation des déclarations et réactivité multicanale.",
    features: [
      "Digitalisation des services",
      "Simplification des démarches",
      "Automatisation des remboursements",
      "Déclarations de sinistres",
      "Communication proactive",
      "CRM",
      "WhatsApp Business",
      "Chatbots",
      "Centres d’appels",
      "Micro-assurance",
      "Solutions mobiles"
    ]
  },
  {
    id: "hotellerie-tourisme",
    name: "Hôtellerie & Tourisme",
    slug: "hotellerie-tourisme",
    iconName: "Hotel",
    description: "Expériences de séjour mémorables, gestion de la réputation en ligne et personnalisation des séjours.",
    features: [
      "Amélioration de l’expérience client",
      "Plateformes de réservation",
      "Gestion des avis",
      "Formation à l’accueil",
      "Gestion des plaintes",
      "Fidélisation"
    ]
  },
  {
    id: "transports-logistique",
    name: "Transports & Logistique",
    slug: "transports-logistique",
    iconName: "Truck",
    description: "Traçabilité rigoureuse, alertes en temps réel et communication proactive avec les destinataires.",
    features: [
      "Suivi des livraisons",
      "Gestion des retards",
      "Communication avec les clients",
      "Information en temps réel",
      "Gestion des imprévus",
      "Transparence"
    ]
  },
  {
    id: "projets-developpement",
    name: "Projets de développement",
    slug: "projets-developpement",
    iconName: "Users2",
    description: "Redevabilité sociale, écoute des bénéficiaires et alignement rigoureux sur les mécanismes MEAL.",
    features: [
      "Identification et segmentation des parties prenantes",
      "Communication",
      "Engagement actif",
      "Mécanismes de feedback",
      "Redevabilité",
      "Analyse",
      "Reporting relationnel",
      "Fidélisation",
      "Capitalisation de la confiance",
      "Intégration au MEAL",
      "Renforcement de la culture relationnelle"
    ]
  },
  {
    id: "telecommunications",
    name: "Télécommunications",
    slug: "telecommunications",
    iconName: "Radio",
    description: "Gestion des volumes massifs, résolutions au premier contact et parcours digitaux fluides.",
    features: [
      "Gestion des réclamations",
      "Gestion des abonnements",
      "Amélioration du service client",
      "Chatbots",
      "Centres d’appels modernisés",
      "Suivi client"
    ]
  }
];

export const METHODOLOGY_STEPS = [
  {
    number: "01",
    title: "Comprendre",
    subtitle: "Analyse des besoins",
    description: "Immersion complète dans votre écosystème pour identifier les défis relationnels, technologiques et organisationnels.",
    details: [
      "Diagnostic de l'existant et des points de friction",
      "Cartographie des attentes clients et collaborateurs",
      "Définition des indicateurs de performance cibles"
    ]
  },
  {
    number: "02",
    title: "Concevoir",
    subtitle: "Création d’une solution adaptée",
    description: "Élaboration d'architectures sur mesure associant technologies modernes et compétences humaines qualifiées.",
    details: [
      "Design de parcours omnicanaux cohérents",
      "Spécifications techniques et choix des outils",
      "Planification progressive et estimation budgétaire"
    ]
  },
  {
    number: "03",
    title: "Déployer",
    subtitle: "Mise en œuvre",
    description: "Exécution rigoureuse de la solution avec intégration technique, formation des équipes et tests de robustesse.",
    details: [
      "Configuration et déploiement des plateformes",
      "Formation des conseillers et équipes métiers",
      "Lancement progressif et gestion de la bascule"
    ]
  },
  {
    number: "04",
    title: "Optimiser",
    subtitle: "Suivi et amélioration continue",
    description: "Analyse continue des métriques, ajustement des processus et accompagnement dans la durée.",
    details: [
      "Audit régulier de la satisfaction client",
      "Ajustement des scripts, flux et automatisations",
      "Recommandations d'innovation continues"
    ]
  }
];

export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: "test-1",
    quote: "Une expérience vécue avec cette entreprise. Je vous le recommande beaucoup surtout côté Digitalisation, Gestion Relation Client.",
    author: "Avis Perso",
    role: "Client Entreprise",
    company: "Partenaire Niamey"
  },
  {
    id: "test-2",
    quote: "Meilleur en matière de Digitalisation au Niger. N’hésitez pas à les contactez pour une meilleure expérience dans la digitalisation.",
    author: "Avis 2",
    role: "CEO",
    company: "Loyal Themes"
  },
  {
    id: "test-3",
    quote: "Ils sont les meilleures",
    author: "Avis 3",
    role: "Developer",
    company: "Worldlink IT"
  }
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: "faq-1",
    question: "Quels sont les délais habituels de mise en place d’un centre de contact ?",
    answer: "Selon la complexité de votre dispositif et les outils à intégrer (CRM, téléphonie IP), nos équipes opérationnelles à Niamey déploient un centre de contact opérationnel entre 5 et 15 jours ouvrés.",
    category: "Centres de Contact",
    displayOrder: 1,
    status: "published"
  },
  {
    id: "faq-2",
    question: "Intervenez-vous uniquement au Niger ou également à l’international ?",
    answer: "Excellence Services SARL dispose de son siège opérationnel à Niamey et intervient pour des organisations au Niger ainsi que pour des partenaires dans toute la sous-région UEMOA et en Afrique de l’Ouest.",
    category: "Général",
    displayOrder: 2,
    status: "published"
  },
  {
    id: "faq-3",
    question: "Pouvez-vous former nos équipes internes à la relation client ?",
    answer: "Oui, nous proposons des modules certifiants en gestion de l'accueil, posture professionnelle, gestion des réclamations et prise en main des outils CRM.",
    category: "Formation",
    displayOrder: 3,
    status: "published"
  },
  {
    id: "faq-4",
    question: "Comment obtenir une proposition technique et financière personnalisée ?",
    answer: "Vous pouvez remplir directement notre formulaire de devis en ligne ou contacter nos conseillers par téléphone ou WhatsApp pour convenir d'un échange préliminaire sous 24h.",
    category: "Offres & Devis",
    displayOrder: 4,
    status: "published"
  }
];

export const DEFAULT_PAGES_CONTENT = {
  home: {
    id: "page-home",
    slug: "home",
    name: "Page d'Accueil",
    title: "L’Excellence opérationnelle au service de votre Relation Client & Digitalisation",
    subtitle: "Excellence Services SARL accompagne les entreprises dans leur relation client, leur transformation numérique, leur développement commercial et leur expérience digitale.",
    content: "Leader de la gestion relation client et des technologies digitales au Niger.",
    ctaText: "Demander un devis",
    ctaLink: "/devis",
    seoTitle: "Excellence Services SARL — Relation Client & Digitalisation à Niamey",
    seoDescription: "Accompagnement premium en centres de contact, CRM, applications web et transformation digitale au Niger et en Afrique de l'Ouest."
  },
  about: {
    id: "page-about",
    slug: "a-propos",
    name: "À Propos",
    title: "Une vision résolument tournée vers l’Excellence et l’Humain",
    subtitle: "Créée pour hisser les standards relationnels au Niger et en Afrique de l’Ouest.",
    content: "Excellence Services SARL combine compétences humaines qualifiées, outils technologiques modernes et conformité réglementaire absolue.",
    ctaText: "Découvrir nos solutions",
    ctaLink: "/services",
    seoTitle: "À Propos — Excellence Services SARL",
    seoDescription: "Découvrez notre vision, nos valeurs fondamentales et nos engagements institutionnels."
  },
  contact: {
    id: "page-contact",
    slug: "contact",
    name: "Contact & Siège",
    title: "Contactez nos conseillers à Niamey",
    subtitle: "Une équipe réactive à votre écoute pour échanger sur vos ambitions de croissance.",
    content: "Disponible du Lundi au Vendredi de 09h30 à 17h30 au siège opérationnel à Niamey, Niger.",
    ctaText: "Écrire sur WhatsApp",
    ctaLink: "https://wa.me/22778798900",
    seoTitle: "Contact — Excellence Services SARL Niamey",
    seoDescription: "Coordonnées officielles, téléphones, email et localisation d'Excellence Services SARL à Niamey."
  }
};

export const DEFAULT_PARTNERS: PartnerItem[] = [
  {
    id: "partner-1",
    name: "Loyal Themes",
    category: "Tech & Expérience Digitale",
    description: "Conception d'interfaces web et solutions logicielles professionnelles adaptées aux standards internationaux.",
    website: "https://loyalthemes.com",
    status: "active",
    displayOrder: 1,
  },
  {
    id: "partner-2",
    name: "Worldlink IT Solutions",
    category: "Infrastructures & Systèmes IT",
    description: "Fournisseur d'infrastructures serveurs, télécoms et réseaux sécurisés pour centres d'appels.",
    website: "https://worldlink.com",
    status: "active",
    displayOrder: 2,
  },
  {
    id: "partner-3",
    name: "UEMOA Fintech Alliance",
    category: "Paiements & Digitalisation",
    description: "Écosystème d'intégration des moyens de paiement électronique et mobile money dans l'espace régional.",
    status: "active",
    displayOrder: 3,
  },
  {
    id: "partner-4",
    name: "Sahel Telecom Services",
    category: "Télécommunications & Voix",
    description: "Réseaux d'interconnexion SIP, numéros verts et liaisons data spécialisées pour l'Afrique de l'Ouest.",
    status: "active",
    displayOrder: 4,
  },
  {
    id: "partner-5",
    name: "Niger Logistique Express",
    category: "Transport & Messagerie",
    description: "Partenaire de distribution et de gestion logistique du dernier kilomètre pour les commerces en ligne.",
    status: "active",
    displayOrder: 5,
  }
];

export const DEFAULT_PROJECTS: ProjectItem[] = [
  {
    id: "proj-1",
    title: "Centre de Contact & Support Client 7j/7",
    category: "Centres de Contact",
    client: "Opérateur de Services & Télécoms",
    summary: "Externalisation complète du standard téléphonique, traitement des réclamations usagers et supervision en direct.",
    deliverables: ["Standard multicanal", "Routage d'appels intelligent", "Tableaux de bord KPI"],
    imageUrl: LOCAL_IMAGES.africanContactCenter,
    status: "featured",
  },
  {
    id: "proj-2",
    title: "Déploiement CRM & Automatisation des Ventes",
    category: "CRM & Digital",
    client: "Compagnie d'Assurances",
    summary: "Centralisation de 10 000+ dossiers assurés, suivi automatisé des relances et portail d'adhésion en ligne.",
    deliverables: ["Migration base de données", "Workflows automatiques", "Formation équipes"],
    imageUrl: LOCAL_IMAGES.insuranceAdvisor,
    status: "featured",
  },
  {
    id: "proj-3",
    title: "Plateforme E-commerce & Logistique Locale",
    category: "E-commerce",
    client: "Réseau de Distribution à Niamey",
    summary: "Création d'un catalogue digital responsive avec commande directe WhatsApp et traçabilité des livraisons.",
    deliverables: ["Paiement mobile sécurisé", "Intégration WhatsApp", "Gestion des stocks"],
    imageUrl: LOCAL_IMAGES.ecommerceSales,
    status: "featured",
  },
  {
    id: "proj-4",
    title: "Dispositif MEAL & Enquêtes de Satisfaction",
    category: "Conseil & Études",
    client: "Programme de Développement Institutionnel",
    summary: "Campagne d'appels et collecte de données terrain pour mesurer l'impact et la satisfaction des bénéficiaires.",
    deliverables: ["Enquête téléphonique", "Analyse statistique", "Rapport de redevabilité"],
    imageUrl: LOCAL_IMAGES.ngoDevelopment,
    status: "featured",
  },
  {
    id: "proj-5",
    title: "Portail Web Métier & Prise de Rendez-vous",
    category: "Web & Mobile",
    client: "Établissement Hôtelier & Événementiel",
    summary: "Refonte de la vitrine numérique avec moteur de réservation immédiat et notification automatique des équipes.",
    deliverables: ["Design sur mesure", "SEO optimisé", "Interface responsive mobile-first"],
    imageUrl: LOCAL_IMAGES.africanHospitality,
    status: "featured",
  }
];
