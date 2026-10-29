import { ArticleItem } from '../types';
import { LOCAL_IMAGES, getResponsiveSrcSet } from './images';

export const BLOG_ARTICLES: ArticleItem[] = [
  {
    id: 'art-1',
    title: "L'essor des centres de contact omnicanaux au Niger : valoriser chaque interaction usager",
    slug: 'essor-centres-contact-omnicanaux-niger',
    category: 'Relation Client & BPO',
    date: '12 Mars 2026',
    readTime: '4 min',
    imageUrl: LOCAL_IMAGES.africanContactCenter,
    imageMobileUrl: LOCAL_IMAGES.africanContactCenterMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.africanContactCenterMobile, LOCAL_IMAGES.africanContactCenter),
    author: 'Excellence Services SARL',
    authorRole: 'Direction des Opérations & Qualité',
    summary: "Face aux exigences croissantes des consommateurs et des usagers au Sahel, l'externalisation de la relation client à Niamey s'impose comme un levier stratégique alliant proximité culturelle, réactivité et rigueur contractuelle.",
    content: `La relation client en Afrique de l'Ouest connaît une métamorphose profonde. Les usagers et clients n'attendent plus simplement une réponse : ils exigent de l'instantanéité, une empathie sincère et une résolution effective dès le premier contact.

### 1. La fin du modèle en silos
Pendant longtemps, le téléphone était l'unique canal de réclamation. Aujourd'hui, les consommateurs nigériens sollicitent les marques simultanément par appel vocal, WhatsApp, email et réseaux sociaux. Pour les banques, compagnies d'assurances et distributeurs, maintenir une cohérence d'historique entre ces canaux sans outil centralisé devient impossible.

### 2. Le choix de l'externalisation stratégique à Niamey
Faire appel à un centre de contact local tel qu'Excellence Services SARL permet aux entreprises :
- De s'appuyer sur des téléconseillers formés aux standards internationaux mais parfaitement au fait des spécificités linguistiques et socioculturelles locales (français, haoussa, djerma).
- De convertir des coûts fixes d'infrastructure en charges variables maîtrisées avec des accords de niveau de service (SLA) précis.
- De bénéficier d'un pilotage en temps réel avec indicateurs clés (DMT, FCR, CSAT).

### Conclusion
La relation client n'est plus un centre de coûts, mais le premier ambassadeur de votre marque. Investir dans un dispositif d'accueil d'excellence constitue le socle indispensable d'une croissance pérenne au Niger.`,
    tags: ['Centres de Contact', 'Niamey', 'BPO', 'SLA Qualité'],
    status: 'published'
  },
  {
    id: 'art-2',
    title: 'Automatisation CRM & WhatsApp Business : fluidifier les parcours clients en Afrique de l’Ouest',
    slug: 'automatisation-crm-whatsapp-business-sahel',
    category: 'Solutions CRM & Automatisation',
    date: '04 Mars 2026',
    readTime: '5 min',
    imageUrl: LOCAL_IMAGES.africanDigitalInnov,
    imageMobileUrl: LOCAL_IMAGES.africanDigitalInnovMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.africanDigitalInnovMobile, LOCAL_IMAGES.africanDigitalInnov),
    author: 'Excellence Services SARL',
    authorRole: 'Pôle Architectures CRM & Solutions Métiers',
    summary: 'Comment centraliser les canaux conversationnels au sein d’un CRM unique pour diviser par trois les délais de prise en charge et fidéliser durablement vos clients.',
    content: `WhatsApp est devenu le canal de communication privilégié au Niger et dans toute la sous-région sahélienne. Cependant, son utilisation artisanale sur des téléphones personnels expose les entreprises à des pertes d'informations et des risques de non-conformité.

### 1. Du compte individuel à l'API WhatsApp Business intégrée
L'intégration de l'API officielle WhatsApp à une plateforme CRM permet d'attribuer automatiquement chaque conversation entrante au bon conseiller ou superviseur, tout en conservant l'historique complet dans la fiche client.

### 2. Automatisation intelligente et routage personnalisé
Grâce à des scénarios automatisés bien calibrés :
- Les accusés de réception et horaires d'ouverture sont envoyés instantanément.
- Les demandes courantes (solde, suivi de dossier, horaires) sont résolues en self-service.
- Les requêtes complexes sont escaladées immédiatement vers un spécialiste disponible.

### 3. Mesure de la satisfaction en continu
À la clôture de chaque échange, un sondage instantané en un clic permet d'évaluer la perception de l'usager, fournissant un baromètre précieux pour l'amélioration continue des processus métiers.`,
    tags: ['CRM', 'WhatsApp Business', 'Automatisation', 'Expérience Client'],
    status: 'published'
  },
  {
    id: 'art-3',
    title: 'Intelligence Artificielle et agents augmentés : l’avenir de la relation client hybride',
    slug: 'ia-agents-augmentes-relation-client-hybride',
    category: 'Transformation Digitale & IA',
    date: '24 Février 2026',
    readTime: '6 min',
    imageUrl: LOCAL_IMAGES.africanTechDevs,
    imageMobileUrl: LOCAL_IMAGES.africanTechDevsMobile,
    srcSet: getResponsiveSrcSet(LOCAL_IMAGES.africanTechDevsMobile, LOCAL_IMAGES.africanTechDevs),
    author: 'Excellence Services SARL',
    authorRole: 'Pôle Digitalisation & Systèmes d’Information',
    summary: "Loin de substituer l'humain, l'intégration de l'IA assiste nos téléconseillers en temps réel : recherche documentaire instantanée, synthèses d'appels et décuplement du taux de résolution au premier contact.",
    content: `Le débat opposant intelligence artificielle et opérateurs humains est dépassé : l'avenir appartient aux organisations qui orchestrent avec finesse la collaboration entre l'IA et l'expertise humaine.

### 1. Le conseiller augmenté
Lorsqu'un client expose un problème technique complexe, le copilote d'IA analyse la conversation et suggère instantanément au téléconseiller la procédure validée, les articles de garantie applicables ou les formulaires requis. Le conseiller n'a plus à chercher manuellement dans des classeurs de procédures : il consacre 100% de son attention à l'écoute active et à la réassurance du client.

### 2. Synthèse et traçabilité automatisées
Dès qu'un appel s'achève, l'outil rédige automatiquement un compte-rendu normalisé dans le CRM, horodaté et catégorisé. Les gains de temps post-appel permettent de réduire les files d'attente pour les usagers suivants.

### 3. Respect strict de la confidentialité des données
Chez Excellence Services SARL, chaque déploiement d'outil d'IA s'effectue dans un cadre souverain et sécurisé, garantissant la confidentialité absolue des données des clients et des entreprises partenaires au Niger.`,
    tags: ['Intelligence Artificielle', 'Digitalisation', 'Agents Augmentés', 'Innovation'],
    status: 'published'
  }
];
