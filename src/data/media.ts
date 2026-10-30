import { MediaItem } from '../types';
import { LOCAL_IMAGES, getResponsiveSrcSet } from './images';

export const SITE_MEDIA_CATALOG: Record<string, MediaItem> = {
  "hero-main": {
    id: "hero-main",
    name: "Hero — Centre de Contact & Digitalisation",
    description: "Professionnels africains noirs dans un environnement technologique et centre de contact contemporain à Niamey avec casques de communication et outils numériques.",
    location: "hero-main",
    url: LOCAL_IMAGES.heroWestAfrica,
    mobileUrl: LOCAL_IMAGES.heroWestAfricaMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.heroWestAfricaMobile, LOCAL_IMAGES.heroWestAfrica),
    alt: "Équipe d'experts et téléconseillers africains noirs en centre d'opérations moderne chez Excellence Services SARL à Niamey",
    category: "hero",
    aspectRatio: "16:9",
    priority: true
  },
  "about-institutional": {
    id: "about-institutional",
    name: "À Propos — Gouvernance & Conseil Stratégique",
    description: "Équipe dirigeante et consultants africains noirs en réunion stratégique dans un bureau contemporain, incarnant confiance, rigueur et performance.",
    location: "about-institutional",
    url: LOCAL_IMAGES.africanBoardroom,
    mobileUrl: LOCAL_IMAGES.africanBoardroomMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.africanBoardroomMobile, LOCAL_IMAGES.africanBoardroom),
    alt: "Équipe de direction et consultants seniors africains noirs en séance de stratégie d'entreprise",
    category: "about",
    aspectRatio: "16:9"
  },
  "service-01-contact-center": {
    id: "service-01-contact-center",
    name: "01 — Centres de Contact & Relation Client",
    description: "Téléconseillers et superviseurs africains noirs équipés de casques sans fil opérant sur des postes modernes avec outils CRM multicanaux.",
    location: "service-01",
    url: LOCAL_IMAGES.africanContactCenter,
    mobileUrl: LOCAL_IMAGES.africanContactCenterMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.africanContactCenterMobile, LOCAL_IMAGES.africanContactCenter),
    alt: "Professionnels africains noirs dans un centre de contact d'excellence à Niamey",
    category: "service",
    aspectRatio: "4:3"
  },
  "service-02-crm": {
    id: "service-02-crm",
    name: "02 — Solutions CRM & Technologies de la Relation Client",
    description: "Environnement technologique CRM avec tableaux de bord analytiques, tickets et support omnicanal animés par un professionnel africain noir.",
    location: "service-02",
    url: LOCAL_IMAGES.africanCustomerCare,
    mobileUrl: LOCAL_IMAGES.africanCustomerCareMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.africanCustomerCareMobile, LOCAL_IMAGES.africanCustomerCare),
    alt: "Expert support et téléconseiller africain noir opérant sur une console CRM multicanale",
    category: "service",
    aspectRatio: "4:3"
  },
  "service-03-conseil": {
    id: "service-03-conseil",
    name: "03 — Conseil, Audit & Stratégie Client",
    description: "Consultant senior africain noir échangeant avec un dirigeant d'entreprise sur la modélisation de sa stratégie de fidélisation.",
    location: "service-03",
    url: LOCAL_IMAGES.africanClientAdvisory,
    mobileUrl: LOCAL_IMAGES.africanClientAdvisoryMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.africanClientAdvisoryMobile, LOCAL_IMAGES.africanClientAdvisory),
    alt: "Conseiller d'affaires africain noir en réunion d'audit et de stratégie avec un client partenaire",
    category: "service",
    aspectRatio: "4:3"
  },
  "service-04-digital-web": {
    id: "service-04-digital-web",
    name: "04 — Digital, Web & Applications",
    description: "Développeurs logiciels africains noirs concevant des architectures web et applications mobiles sécurisées et ergonomiques.",
    location: "service-04",
    url: LOCAL_IMAGES.africanTechDevs,
    mobileUrl: LOCAL_IMAGES.africanTechDevsMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.africanTechDevsMobile, LOCAL_IMAGES.africanTechDevs),
    alt: "Ingénieurs logiciels et développeurs africains noirs concevant des applications digitales haute performance",
    category: "service",
    aspectRatio: "4:3"
  },
  "service-05-commercial": {
    id: "service-05-commercial",
    name: "05 — Développement Commercial & Représentation",
    description: "Professionnels africains noirs en négociation d'affaires B2B et conclusion de partenariats stratégiques pour l'Afrique de l'Ouest.",
    location: "service-05",
    url: LOCAL_IMAGES.africanPartnership,
    mobileUrl: LOCAL_IMAGES.africanPartnershipMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.africanPartnershipMobile, LOCAL_IMAGES.africanPartnership),
    alt: "Partenariat d'affaires et poignée de main commerciale conclue par des cadres africains noirs",
    category: "service",
    aspectRatio: "4:3"
  },
  "service-06-transformation": {
    id: "service-06-transformation",
    name: "06 — Transformation Numérique des Entreprises",
    description: "Transition méthodique et conduite du changement vers des processus digitalisés par des experts africains.",
    location: "service-06",
    url: LOCAL_IMAGES.africanDigitalInnov,
    mobileUrl: LOCAL_IMAGES.africanDigitalInnovMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.africanDigitalInnovMobile, LOCAL_IMAGES.africanDigitalInnov),
    alt: "Équipe d'experts africains noirs pilotant un laboratoire de transformation digitale",
    category: "service",
    aspectRatio: "4:3"
  },
  "service-07-innovation": {
    id: "service-07-innovation",
    name: "07 — Innovation & Expérience Client Avancée",
    description: "Atelier d'innovation collaborative et co-conception de parcours clients mené par des cadres africains noirs.",
    location: "service-07",
    url: LOCAL_IMAGES.innovationLab,
    mobileUrl: LOCAL_IMAGES.innovationLabMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.innovationLabMobile, LOCAL_IMAGES.innovationLab),
    alt: "Atelier d'innovation et d'expérience client avec des décideurs africains noirs",
    category: "service",
    aspectRatio: "4:3"
  },
  "service-08-ecommerce": {
    id: "service-08-ecommerce",
    name: "08 — E-commerce & Plateformes de Vente",
    description: "Plateformes de vente numérique et gestion des transactions et livraisons par des professionnels africains du commerce digital.",
    location: "service-08",
    url: LOCAL_IMAGES.ecommerceSales,
    mobileUrl: LOCAL_IMAGES.ecommerceSalesMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.ecommerceSalesMobile, LOCAL_IMAGES.ecommerceSales),
    alt: "Gestion de plateforme e-commerce et solutions de vente en ligne par des experts africains",
    category: "service",
    aspectRatio: "4:3"
  },
  "sector-assurances": {
    id: "sector-assurances",
    name: "Secteur — Assurances & Prévoyance",
    description: "Gestion diligente des déclarations de sinistres et relation de confiance avec les assurés au Niger.",
    location: "sector-assurances",
    url: LOCAL_IMAGES.insuranceAdvisor,
    mobileUrl: LOCAL_IMAGES.insuranceAdvisorMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.insuranceAdvisorMobile, LOCAL_IMAGES.insuranceAdvisor),
    alt: "Conseiller africain noir accompagnant des assurés et entreprises partenaires",
    category: "sector",
    aspectRatio: "4:3"
  },
  "sector-hotellerie": {
    id: "sector-hotellerie",
    name: "Secteur — Hôtellerie & Tourisme",
    description: "Accueil d'excellence, conciergerie et accompagnement des voyageurs et clients d'affaires dans un hôtel de prestige.",
    location: "sector-hotellerie",
    url: LOCAL_IMAGES.africanHospitality,
    mobileUrl: LOCAL_IMAGES.africanHospitalityMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.africanHospitalityMobile, LOCAL_IMAGES.africanHospitality),
    alt: "Concierge africaine noire accueillant chaleureusement un client d'affaires dans un lobby hôtelier à Niamey",
    category: "sector",
    aspectRatio: "4:3"
  },
  "sector-transports": {
    id: "sector-transports",
    name: "Secteur — Transports & Logistique",
    description: "Superviseur logistique africain noir pilotant les flux de fret et la traçabilité des livraisons en temps réel.",
    location: "sector-transports",
    url: LOCAL_IMAGES.africanLogistics,
    mobileUrl: LOCAL_IMAGES.africanLogisticsMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.africanLogisticsMobile, LOCAL_IMAGES.africanLogistics),
    alt: "Superviseur logistique africain noir gérant les expéditions avec une tablette numérique",
    category: "sector",
    aspectRatio: "4:3"
  },
  "sector-projets": {
    id: "sector-projets",
    name: "Secteur — Projets de Développement & ONG",
    description: "Lignes d'écoute citoyenne, recueil de doléances, suivi MEAL et redevabilité envers les communautés.",
    location: "sector-projets",
    url: LOCAL_IMAGES.ngoDevelopment,
    mobileUrl: LOCAL_IMAGES.ngoDevelopmentMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.ngoDevelopmentMobile, LOCAL_IMAGES.ngoDevelopment),
    alt: "Comité de pilotage et suivi de projet de développement avec des spécialistes africains noirs",
    category: "sector",
    aspectRatio: "4:3"
  },
  "sector-telecom": {
    id: "sector-telecom",
    name: "Secteur — Télécommunications & Réseaux",
    description: "Centre d'assistance technique 24/7 pour les abonnés et gestion de flux massifs d'appels.",
    location: "sector-telecom",
    url: LOCAL_IMAGES.telecomNetwork,
    mobileUrl: LOCAL_IMAGES.telecomNetworkMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.telecomNetworkMobile, LOCAL_IMAGES.telecomNetwork),
    alt: "Ingénieurs et techniciens support télécoms africains noirs au centre de supervision",
    category: "sector",
    aspectRatio: "4:3"
  },
  "approach-methodology": {
    id: "approach-methodology",
    name: "Approche — Démarche Méthodologique & Rigueur",
    description: "Cartographie visuelle de la démarche d'accompagnement : Diagnostic, Stratégie, Déploiement et Optimisation.",
    location: "approach-methodology",
    url: LOCAL_IMAGES.approachStrategy,
    mobileUrl: LOCAL_IMAGES.approachStrategyMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.approachStrategyMobile, LOCAL_IMAGES.approachStrategy),
    alt: "Séance de travail méthodologique avec l'équipe de consultants africains noirs",
    category: "approach",
    aspectRatio: "16:9"
  },
  "contact-multichannel": {
    id: "contact-multichannel",
    name: "Contact — Relation Client & Échange Direct",
    description: "Conseiller professionnel africain noir à l'écoute pour toute demande d'audit ou de devis personnalisé.",
    location: "contact-multichannel",
    url: LOCAL_IMAGES.contactDesk,
    mobileUrl: LOCAL_IMAGES.contactDeskMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.contactDeskMobile, LOCAL_IMAGES.contactDesk),
    alt: "Conseillère africaine noire en relation client professionnelle au siège de Niamey",
    category: "contact",
    aspectRatio: "4:3"
  },
  "recognition-vivaesim-certificate": {
    id: "recognition-vivaesim-certificate",
    name: "Reconnaissance — Certificat officiel VivaeSIM",
    description: "Official Certificate of Satisfaction and Recognition n° VES-2025-001 délivré le 3 juin 2026 par Viva Nation Limited (Vivape | VivaeSIM) à Excellence Services SARL.",
    location: "recognition-vivaesim-certificate",
    url: LOCAL_IMAGES.vivaesimCertificate,
    mobileUrl: LOCAL_IMAGES.vivaesimCertificateMobile,
    srcSet: `${LOCAL_IMAGES.vivaesimCertificateMobile} 720w, ${LOCAL_IMAGES.vivaesimCertificate} 1080w`,
    alt: "Certificat officiel de satisfaction et de reconnaissance VivaeSIM n° VES-2025-001 décerné à Excellence Services SARL le 3 juin 2026",
    category: "recognition",
    aspectRatio: "4:3"
  }
};

export const CURATED_IMAGES = {
  hero: { 
    url: SITE_MEDIA_CATALOG["hero-main"].url, 
    mobileUrl: SITE_MEDIA_CATALOG["hero-main"].mobileUrl,
    srcSet: SITE_MEDIA_CATALOG["hero-main"].srcSet,
    alt: SITE_MEDIA_CATALOG["hero-main"].alt 
  },
  aboutTeam: { 
    url: SITE_MEDIA_CATALOG["about-institutional"].url, 
    mobileUrl: SITE_MEDIA_CATALOG["about-institutional"].mobileUrl,
    srcSet: SITE_MEDIA_CATALOG["about-institutional"].srcSet,
    alt: SITE_MEDIA_CATALOG["about-institutional"].alt 
  },
  consulting: { 
    url: SITE_MEDIA_CATALOG["service-03-conseil"].url, 
    mobileUrl: SITE_MEDIA_CATALOG["service-03-conseil"].mobileUrl,
    srcSet: SITE_MEDIA_CATALOG["service-03-conseil"].srcSet,
    alt: SITE_MEDIA_CATALOG["service-03-conseil"].alt 
  },
  approach: { 
    url: SITE_MEDIA_CATALOG["approach-methodology"].url, 
    mobileUrl: SITE_MEDIA_CATALOG["approach-methodology"].mobileUrl,
    srcSet: SITE_MEDIA_CATALOG["approach-methodology"].srcSet,
    alt: SITE_MEDIA_CATALOG["approach-methodology"].alt 
  },
  contact: { 
    url: SITE_MEDIA_CATALOG["contact-multichannel"].url, 
    mobileUrl: SITE_MEDIA_CATALOG["contact-multichannel"].mobileUrl,
    srcSet: SITE_MEDIA_CATALOG["contact-multichannel"].srcSet,
    alt: SITE_MEDIA_CATALOG["contact-multichannel"].alt 
  },
  vivaesimCertificate: {
    url: SITE_MEDIA_CATALOG["recognition-vivaesim-certificate"].url,
    mobileUrl: SITE_MEDIA_CATALOG["recognition-vivaesim-certificate"].mobileUrl,
    srcSet: SITE_MEDIA_CATALOG["recognition-vivaesim-certificate"].srcSet,
    alt: SITE_MEDIA_CATALOG["recognition-vivaesim-certificate"].alt
  },
};
