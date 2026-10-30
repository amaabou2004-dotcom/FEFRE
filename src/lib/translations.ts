export type Language = 'fr' | 'en';

export interface TranslationDictionary {
  [key: string]: {
    fr: string;
    en: string;
  };
}

export const TRANSLATIONS: TranslationDictionary = {
  // Navigation
  'nav.home': { fr: 'Accueil', en: 'Home' },
  'nav.about': { fr: 'À propos', en: 'About Us' },
  'nav.services': { fr: 'Services', en: 'Services' },
  'nav.sectors': { fr: "Secteurs d'activité", en: 'Sectors' },
  'nav.portfolio': { fr: 'Réalisations', en: 'Portfolio' },
  'nav.news': { fr: 'Actualités', en: 'News' },
  'nav.contact': { fr: 'Contact', en: 'Contact' },
  'nav.quote': { fr: 'Devis en ligne', en: 'Get a Quote' },
  'nav.partner_space': { fr: 'Espace Partenaire', en: 'Partner Portal' },
  'nav.admin': { fr: 'Administration', en: 'Admin' },
  'nav.consult_ai': { fr: 'Assistant IA', en: 'AI Assistant' },
  'nav.consult_ai_long': { fr: "Consulter l'Assistant IA", en: 'Consult AI Assistant' },
  'nav.request_quote': { fr: 'Demander un devis', en: 'Request a Quote' },
  'nav.quote_short': { fr: 'Devis', en: 'Quote' },
  'nav.menu': { fr: 'Menu', en: 'Menu' },
  'nav.mobile_primary': { fr: 'Navigation mobile principale', en: 'Primary mobile navigation' },
  'nav.services_dropdown_title': { fr: "Nos 8 Domaines d'Expertise", en: 'Our 8 Practice Areas' },
  'nav.view_all_services': { fr: "Voir la vue d'ensemble", en: 'View full overview' },
  'nav.double_click_admin': { fr: "Double-cliquez pour accéder à l'espace administrateur", en: 'Double-click to access admin console' },

  // Hero Section
  'hero.badge': { fr: 'Pôle d’Excellence Relation Client & Digital', en: 'Customer Relationship & Digital Excellence Center' },
  'hero.location': { fr: 'Niamey • Niger', en: 'Niamey • Niger' },
  'hero.title_pre': { fr: 'Excellence Services SARL : Votre partenaire en ', en: 'Excellence Services SARL: Your partner in ' },
  'hero.title_highlight1': { fr: 'Relation Client', en: 'Customer Relationship' },
  'hero.title_mid': { fr: ' & ', en: ' & ' },
  'hero.title_highlight2': { fr: 'Digitalisation', en: 'Digitalization' },
  'hero.title_post': { fr: ' à Niamey.', en: ' in Niamey.' },
  'hero.description': {
    fr: "Nous accompagnons les grandes entreprises, institutions et PME dans la gestion de centres de contact omnicanaux, l'intégration CRM, l'ingénierie web et la transformation numérique au Niger et en Afrique de l'Ouest.",
    en: 'We assist corporations, institutions, and SMEs with omnichannel contact center management, CRM integration, web engineering, and digital transformation in Niger and West Africa.',
  },
  'hero.cta_services': { fr: 'Découvrir nos services', en: 'Discover our services' },
  'hero.cta_ai': { fr: "Consulter l'Assistant IA", en: 'Consult AI Assistant' },
  'hero.cta_contact': { fr: 'Nous contacter', en: 'Contact us' },
  'hero.nif_label': { fr: 'NIF :', en: 'NIF:' },
  'hero.rccm_label': { fr: 'RCCM :', en: 'RCCM:' },
  'hero.visual_subtitle': { fr: 'Siège Opérationnel • Niamey', en: 'Operational Headquarters • Niamey' },
  'hero.visual_title': { fr: 'Téléconseillers, Superviseurs & Consultants', en: 'Customer Advisors, Supervisors & Consultants' },

  // Trust Stats
  'stats.stat1_value': { fr: '98,5%', en: '98.5%' },
  'stats.stat1_label': { fr: 'Taux de satisfaction client', en: 'Client satisfaction rate' },
  'stats.stat1_sub': { fr: 'Sur nos opérations de centre de contact', en: 'Across our contact center operations' },
  'stats.stat2_value': { fr: '8 Pôles', en: '8 Units' },
  'stats.stat2_label': { fr: 'D’expertises intégrées', en: 'Integrated practice areas' },
  'stats.stat2_sub': { fr: 'Du centre d’appel au CRM et web', en: 'From call center to CRM and web' },
  'stats.stat3_value': { fr: '100% Dédié', en: '100% Dedicated' },
  'stats.stat3_label': { fr: 'Ancrage & équipes à Niamey', en: 'Teams & facilities in Niamey' },
  'stats.stat3_sub': { fr: 'Experts bilingues et conformité NIF/RCCM', en: 'Bilingual experts & full tax compliance' },
  'stats.stat4_value': { fr: '24h/48h', en: '24h/48h' },
  'stats.stat4_label': { fr: 'Délai d’étude de devis', en: 'Quote turnaround time' },
  'stats.stat4_sub': { fr: 'Chiffrage express sur mesure', en: 'Express tailored quotation' },

  // Services Section
  'services.badge': { fr: "Solutions & Pôles d'Expertise", en: 'Solutions & Practice Areas' },
  'services.title': { fr: 'Une suite complète de solutions pour votre transformation opérationnelle.', en: 'A comprehensive suite of solutions for your operational transformation.' },
  'services.description': {
    fr: "Faites défiler pour explorer nos 8 pôles d'expertises intégrées : centre de contact multicanal, déploiement CRM, développement web et digitalisation à Niamey.",
    en: 'Scroll to explore our 8 integrated practice areas: multichannel contact center, CRM deployment, web development, and digitalization in Niamey.',
  },
  'services.view_full_catalog': { fr: 'Voir le catalogue complet', en: 'View full catalog' },
  'services.learn_more': { fr: 'En savoir plus', en: 'Learn more' },
  'services.quick_view': { fr: 'Aperçu rapide', en: 'Quick overview' },
  'services.need_custom': { fr: "Besoin d'un accompagnement spécifique à Niamey ?", en: 'Need tailored assistance in Niamey?' },
  'services.need_custom_sub': { fr: 'Nos consultants analysent vos besoins et vous proposent un devis rapide sans engagement.', en: 'Our consultants assess your requirements and provide a fast, non-binding quote.' },

  // Services specific translations
  'service.01.title': { fr: 'Centres de Contact & Relation Client', en: 'Contact Centers & Customer Relationship' },
  'service.01.pos': { fr: 'Cœur métier – Opérations & performance relationnelle.', en: 'Core business – Operations & relational performance.' },
  'service.01.sum': { fr: 'Gestion externalisée, support multicanal et excellence opérationnelle pour valoriser chaque interaction client.', en: 'Outsourced management, multichannel support, and operational excellence to enhance every customer interaction.' },

  'service.02.title': { fr: 'Solutions CRM & Technologies de la Relation Client', en: 'CRM Solutions & Customer Relationship Tech' },
  'service.02.pos': { fr: 'Intégration, paramétrage & automatisation intelligente.', en: 'Integration, configuration & smart automation.' },
  'service.02.sum': { fr: 'Déploiement et personnalisation de CRM leaders (HubSpot, Salesforce, Zoho) pour piloter vos parcours clients.', en: 'Deployment and customization of leading CRMs (HubSpot, Salesforce, Zoho) to streamline customer journeys.' },

  'service.03.title': { fr: 'Télémarketing, Prospection & Vente à Distance', en: 'Telemarketing, Lead Generation & Remote Sales' },
  'service.03.pos': { fr: 'Accélération commerciale & génération de leads qualifiés.', en: 'Commercial acceleration & qualified lead generation.' },
  'service.03.sum': { fr: 'Campagnes d’appels sortants, prise de rendez-vous B2B/B2C et télévente ciblée pour démultiplier vos ventes.', en: 'Outbound campaigns, B2B/B2C appointment setting, and targeted telesales to scale your revenue.' },

  'service.04.title': { fr: 'Audit, Conseil & Stratégie Expérience Client (CX)', en: 'CX Audit, Consulting & Customer Experience Strategy' },
  'service.04.pos': { fr: 'Diagnostic organisationnel & feuille de route stratégique.', en: 'Organizational diagnosis & strategic roadmap.' },
  'service.04.sum': { fr: 'Cartographie des parcours, audits qualité et plans d’action pour hisser vos standards de service au niveau international.', en: 'Journey mapping, quality audits, and action plans to elevate your service standards to international excellence.' },

  'service.05.title': { fr: 'Recouvrement Amiable & Gestion des Impayés', en: 'Amicable Debt Collection & Recovery Management' },
  'service.05.pos': { fr: 'Préservation de la relation commerciale & sécurisation du cash flow.', en: 'Preserving client relationships & securing cash flow.' },
  'service.05.sum': { fr: 'Relances préventives, médiation respectueuse et gestion rigoureuse des créances pour accélérer vos encaissements.', en: 'Preventive reminders, respectful mediation, and rigorous receivables management to accelerate collections.' },

  'service.06.title': { fr: 'Digitalisation, Solutions Web & E-Commerce', en: 'Digitalization, Web Solutions & E-Commerce' },
  'service.06.pos': { fr: 'Ingénierie digitale, portails métiers & visibilité web.', en: 'Digital engineering, business portals & web visibility.' },
  'service.06.sum': { fr: 'Création de sites web professionnels, plateformes e-commerce et applications interactives pour digitaliser vos activités.', en: 'Creation of professional websites, e-commerce platforms, and interactive applications to digitalize your operations.' },

  'service.07.title': { fr: 'Formation & Renforcement des Compétences', en: 'Training & Professional Skills Development' },
  'service.07.pos': { fr: 'Capital humain, savoir-faire relationnel & posture d’excellence.', en: 'Human capital, interpersonal skills & posture of excellence.' },
  'service.07.sum': { fr: 'Modules pratiques certifiants pour téléconseillers, superviseurs et managers : écoute active, gestion des objections et CRM.', en: 'Practical certifying workshops for advisors, supervisors, and managers: active listening, objection handling, and CRM.' },

  'service.08.title': { fr: 'Vente & Équipements Professionnels Spécialisés', en: 'Sales & Specialized Professional Equipment' },
  'service.08.pos': { fr: 'Matériel télécom certifié, casques haute réduction de bruit & infrastructure.', en: 'Certified telecom hardware, noise-cancelling headsets & infrastructure.' },
  'service.08.sum': { fr: 'Fourniture de stations de travail, casques anti-bruit professionnels et serveurs télécoms pour centres d’appels.', en: 'Supply of workstations, professional noise-cancelling headsets, and telecom servers for call centers.' },

  // About Preview
  'about_prev.badge': { fr: 'À Propos de Nous', en: 'About Us' },
  'about_prev.title': { fr: 'Un partenaire stratégique pour hisser votre expérience client au plus haut niveau.', en: 'A strategic partner to elevate your customer experience to the highest level.' },
  'about_prev.desc1': {
    fr: "EXCELLENCE SERVICES SARL est une société de droit nigérien immatriculée au RCCM de Niamey, spécialisée dans la relation client multicanale, la transformation numérique et l'intégration technologique.",
    en: 'EXCELLENCE SERVICES SARL is a Nigerien company registered with the Niamey RCCM, specializing in multichannel customer relationship, digital transformation, and technological integration.',
  },
  'about_prev.desc2': {
    fr: 'Implantés au cœur de Niamey, nous combinons la maîtrise des outils de pointe (CRM, téléphonie VoIP, plateformes omnicanales) avec une connaissance fine des dynamiques économiques nigériennes et régionales.',
    en: 'Based in the heart of Niamey, we combine advanced tools (CRM, VoIP telephony, omnichannel platforms) with deep knowledge of Nigerien and regional economic dynamics.',
  },
  'about_prev.cta': { fr: 'Découvrir notre histoire & nos engagements', en: 'Discover our story & commitments' },
  'about_prev.card_subtitle': { fr: 'Gouvernance & Équipe Opérationnelle', en: 'Governance & Operations Team' },

  // Sectors Section
  'sectors.badge': { fr: 'Champs d’Intervention Stratégique', en: 'Strategic Fields of Intervention' },
  'sectors.title': { fr: 'Une expertise éprouvée au service des secteurs clés du Niger.', en: 'Proven expertise serving key economic sectors in Niger.' },
  'sectors.desc': {
    fr: 'Banques, télécoms, microfinance, institutions publiques et distribution : nous modulons nos processus pour répondre aux exigences spécifiques de chaque écosystème.',
    en: 'Banking, telecoms, microfinance, public institutions, and retail: we tailor our processes to meet the unique demands of each ecosystem.',
  },
  'sectors.view_all': { fr: 'Explorer tous les secteurs', en: 'Explore all sectors' },

  // Why Choose Us
  'why.badge': { fr: 'Pourquoi Nous Choisir', en: 'Why Choose Us' },
  'why.title': { fr: '4 atouts majeurs pour votre réussite opérationnelle', en: '4 key strengths driving your operational success' },
  'why.subtitle': {
    fr: "Nous allions encadrement humain d'élite, infrastructure technologique sécurisée à Niamey et engagement contractuel sans faille.",
    en: 'We combine elite human leadership, secure technological infrastructure in Niamey, and uncompromising contractual commitment.',
  },
  'why.adv1_title': { fr: 'Expertise Basée à Niamey', en: 'Niamey-Based Expertise' },
  'why.adv1_desc': { fr: 'Une équipe locale bilingue et qualifiée, maîtrisant les réalités du marché nigérien et ouest-africain.', en: 'A local, qualified, bilingual team mastering the realities of the Nigerien and West African markets.' },
  'why.adv1_hi': { fr: 'Disponibilité 7j/7', en: '7/7 Availability' },
  'why.adv2_title': { fr: 'Technologies & CRM Avancés', en: 'Advanced Technologies & CRM' },
  'why.adv2_desc': { fr: 'Routage omnicanal, intégration CRM et tableaux de bord KPI en temps réel pour piloter vos performances.', en: 'Omnichannel routing, CRM integration, and real-time KPI dashboards to drive performance.' },
  'why.adv2_hi': { fr: 'Outils modernes', en: 'Modern tools' },
  'why.adv3_title': { fr: 'Conformité & Confidentialité', en: 'Compliance & Confidentiality' },
  'why.adv3_desc': { fr: 'Entreprise enregistrée (NIF & RCCM), respect strict du secret des affaires et gouvernance transparente.', en: 'Registered enterprise (NIF & RCCM), strict business secrecy, and transparent governance.' },
  'why.adv3_hi': { fr: 'Garantie légale', en: 'Legal guarantee' },
  'why.adv4_title': { fr: 'Résultats & ROI Mesurables', en: 'Measurable ROI & Results' },
  'why.adv4_desc': { fr: 'Des processus d’assurance qualité rigoureux orientés vers la fidélisation client et la conversion commerciale.', en: 'Rigorous quality assurance processes oriented toward customer retention and commercial conversion.' },
  'why.adv4_hi': { fr: 'Impact immédiat', en: 'Immediate impact' },
  'why.certified_badge': { fr: 'Standard de qualité certifié', en: 'Certified quality standard' },

  // Methodology / Approach
  'approach.badge': { fr: "Méthodologie & Rigueur d'Exécution", en: 'Methodology & Execution Rigor' },
  'approach.title': { fr: 'Notre Approche : une trajectoire maîtrisée en 4 temps.', en: 'Our Approach: a controlled 4-step trajectory.' },
  'approach.desc': {
    fr: "De l'analyse approfondie des besoins jusqu'à l'amélioration continue, nous structurons chaque étape pour garantir un impact tangible et durable sur vos indicateurs de performance.",
    en: 'From in-depth needs analysis to continuous improvement, we structure each phase to guarantee tangible, lasting impact on your KPIs.',
  },
  'approach.step1_title': { fr: 'Diagnostic & Cadrage', en: 'Diagnosis & Scoping' },
  'approach.step1_sub': { fr: 'Analyse Préalable & Objectifs', en: 'Pre-analysis & Objectives' },
  'approach.step1_desc': { fr: 'Immersion dans votre organisation, audit des flux relationnels et définition conjointe des indicateurs clés (SLA, NPS, DMT).', en: 'Immersion in your organization, relationship workflow audit, and joint definition of key metrics (SLA, NPS, AHT).' },
  'approach.step2_title': { fr: 'Déploiement & Intégration', en: 'Deployment & Integration' },
  'approach.step2_sub': { fr: 'Paramétrage & Formation', en: 'Configuration & Training' },
  'approach.step2_desc': { fr: 'Configuration des outils technologiques (CRM, téléphonie VoIP), formation intensive des équipes et tests de bout en bout.', en: 'Setup of technical tools (CRM, VoIP telephony), intensive team training, and end-to-end user testing.' },
  'approach.step3_title': { fr: 'Exploitation & Supervision', en: 'Operations & Supervision' },
  'approach.step3_sub': { fr: 'Exécution Opérationnelle', en: 'Operational Execution' },
  'approach.step3_desc': { fr: 'Prise en charge active des flux multicanaux, double écoute, coaching continu et respect rigoureux des engagements contractuels.', en: 'Active management of multichannel flows, dual monitoring, continuous coaching, and strict adherence to SLAs.' },
  'approach.step4_title': { fr: 'Optimisation Continue', en: 'Continuous Optimization' },
  'approach.step4_sub': { fr: 'Revues & Progrès Durable', en: 'Reviews & Sustained Progress' },
  'approach.step4_desc': { fr: 'Comités de pilotage mensuels, reporting décisionnel détaillé et recommandations proactives pour perfectionner vos parcours.', en: 'Monthly steering committees, detailed executive reporting, and proactive recommendations to refine user journeys.' },
  'approach.active_badge': { fr: 'Étape Active', en: 'Active Step' },
  'approach.sla_badge': { fr: 'Pilotage par Jalons Stratégiques', en: 'Milestone-Based Governance' },

  // Key stats / milestones
  'keystats.badge': { fr: 'Repères Institutionnels', en: 'Institutional Benchmarks' },
  'keystats.title': { fr: 'Nos indicateurs et repères clés', en: 'Our key indicators and benchmarks' },
  'keystats.desc': {
    fr: "Des fondations solides, une gouvernance certifiée et une organisation d'élite pour garantir l’excellence opérationnelle de vos projets au Niger.",
    en: 'Solid foundations, certified governance, and an elite team ensuring operational excellence for your projects in Niger.',
  },
  'keystats.hq': { fr: 'Siège Opérationnel :', en: 'Operational Headquarters:' },

  // Portfolio
  'portfolio.badge': { fr: 'Démonstrations de Savoir-Faire', en: 'Proven Track Record' },
  'portfolio.title': { fr: 'Nos Réalisations Récentes', en: 'Our Recent Achievements' },
  'portfolio.desc': {
    fr: "Découvrez des cas concrets d'interventions menées pour des entreprises, institutions et donneurs d'ordres au Niger et dans la région.",
    en: 'Discover concrete cases of projects delivered for corporations, institutions, and partners across Niger and the region.',
  },
  'portfolio.all': { fr: 'Tous les projets', en: 'All projects' },

  // Partners
  'partners.badge': { fr: 'Alliances Stratégiques & Écosystème', en: 'Strategic Alliances & Ecosystem' },
  'partners.title': { fr: 'Des synergies pérennes avec les acteurs de référence.', en: 'Lasting synergies with industry leaders.' },
  'partners.desc': {
    fr: "Opérateurs télécoms, éditeurs CRM, intégrateurs et institutions : découvrez les organisations qui enrichissent notre dynamique d'excellence.",
    en: 'Telecom operators, CRM software publishers, integrators, and institutions: organizations fueling our drive for excellence.',
  },
  'partners.cta': { fr: 'Devenir partenaire', en: 'Become a partner' },

  // Testimonials
  'testimonials.badge': { fr: 'Témoignages & Retours d’Expérience', en: 'Testimonials & Client Feedback' },
  'testimonials.title': { fr: 'La confiance de nos partenaires et donneurs d’ordre.', en: 'The trust of our clients and partners.' },
  'testimonials.desc': {
    fr: "Découvrez les retours de dirigeants d'entreprises et d'institutions qui ont confié leurs opérations à nos équipes à Niamey.",
    en: 'Read reviews from business and institutional leaders who entrusted their operations to our teams in Niamey.',
  },
  'testimonials.rating': { fr: 'Note 5.0 / 5', en: 'Rating 5.0 / 5' },

  // Digital News
  'news.badge': { fr: 'Veille & Perspectives', en: 'Market Insights & Trends' },
  'news.title': { fr: 'Actualités Digitales', en: 'Digital News' },
  'news.desc': {
    fr: "Décryptages, innovations et retours d'expérience sur la relation client omnicanale, les solutions CRM et la transformation digitale à Niamey et au Sahel.",
    en: 'Analyses, innovations, and takeaways on omnichannel customer care, CRM solutions, and digital transformation in Niamey and the Sahel.',
  },
  'news.view_all': { fr: 'Consulter toutes les actualités', en: 'Read all articles' },
  'news.read_action': { fr: 'Lire', en: 'Read' },
  'news.share_action': { fr: 'Partager', en: 'Share' },
  'news.copied': { fr: 'Lien copié', en: 'Link copied' },

  // Quick Contact
  'contact.badge': { fr: 'Échanges Directs & Localisation', en: 'Direct Inquiries & Location' },
  'contact.title': { fr: 'Parlons de vos objectifs et de vos besoins opérationnels.', en: "Let's discuss your objectives and operational needs." },
  'contact.desc': {
    fr: "Nos directeurs de mission et consultants à Niamey sont à votre écoute pour évaluer vos projets et vous transmettre une proposition d'accompagnement sur mesure.",
    en: 'Our directors and consultants in Niamey are at your service to review your projects and provide a customized proposal.',
  },
  'contact.phone_direct': { fr: 'Téléphone direct', en: 'Direct Phone' },
  'contact.whatsapp_direct': { fr: 'WhatsApp Direct', en: 'WhatsApp Direct' },
  'contact.email_direct': { fr: 'Courrier électronique', en: 'Email Address' },
  'contact.hq_label': { fr: 'Siège à Niamey', en: 'Headquarters in Niamey' },
  'contact.form_title': { fr: 'Transmettez-nous votre demande', en: 'Send us your message' },
  'contact.form_subtitle': { fr: 'Réponse sous 24h ouvrées par un conseiller senior', en: 'Response within 24 business hours by a senior consultant' },
  'contact.name_placeholder': { fr: 'Nom complet ou Raison sociale', en: 'Full Name or Organization' },
  'contact.contact_placeholder': { fr: 'Adresse email ou Téléphone direct', en: 'Email address or Phone number' },
  'contact.message_placeholder': { fr: 'Décrivez brièvement votre projet ou vos questions...', en: 'Briefly describe your project or questions...' },
  'contact.submit_btn': { fr: 'Envoyer ma demande', en: 'Send my message' },
  'contact.submitting': { fr: 'Envoi en cours...', en: 'Sending...' },
  'contact.success_title': { fr: 'Message bien reçu !', en: 'Message successfully received!' },
  'contact.success_desc': { fr: 'Notre direction commerciale prendra contact avec vous dans les plus brefs délais.', en: 'Our commercial team will contact you shortly.' },
  'contact.new_message': { fr: 'Envoyer un autre message', en: 'Send another message' },

  // Floating AI Assistant
  'ai.assistant_title': { fr: 'Conseiller Virtuel', en: 'Virtual Advisor' },
  'ai.assistant_sub': { fr: 'Excellence Services • Niamey', en: 'Excellence Services • Niamey' },
  'ai.online': { fr: 'En ligne', en: 'Online' },
  'ai.typing': { fr: 'Rédaction en cours...', en: 'Thinking...' },
  'ai.input_placeholder': { fr: 'Posez votre question...', en: 'Ask your question...' },
  'ai.listening_placeholder': { fr: 'À votre écoute en vocal...', en: 'Listening to your voice...' },
  'ai.express_quote': { fr: 'Devis express', en: 'Express quote' },
  'ai.whatsapp_direct': { fr: 'WhatsApp direct', en: 'WhatsApp direct' },
  'ai.close': { fr: 'Fermer le chat', en: 'Close chat' },
  'ai.fullscreen': { fr: 'Agrandir en plein écran', en: 'Open in fullscreen' },
  'ai.toggle_open': { fr: 'Discuter avec le Conseiller Virtuel 24/7', en: 'Chat with Virtual Advisor 24/7' },
  'ai.toggle_close': { fr: 'Fermer la fenêtre du chat', en: 'Close chat window' },
  'ai.welcome': {
    fr: "Bonjour et bienvenue chez Excellence Services SARL.\n\nJe suis votre Conseiller Virtuel. Je suis à votre disposition pour vous orienter sur nos expertises (centres d'appels, CRM, télémarketing, recouvrement amiable ou solutions web) et vous guider vers un chiffrage personnalisé à Niamey.\n\nEn quoi puis-je vous renseigner aujourd'hui ?",
    en: 'Hello and welcome to Excellence Services SARL.\n\nI am your Virtual Advisor. I am at your service to guide you on our expertise (call centers, CRM, telemarketing, debt recovery, or web solutions) and assist you with a customized quotation in Niamey.\n\nHow can I assist you today?',
  },

  // AI suggestions
  'ai.sug1': { fr: 'Centre d’appels 24/7', en: '24/7 Call Center' },
  'ai.sug1_q': { fr: 'Quelles sont vos solutions de centre de contact et gestion de la relation client ?', en: 'What are your contact center and customer relationship solutions?' },
  'ai.sug2': { fr: 'Demande de devis', en: 'Quote Request' },
  'ai.sug2_q': { fr: 'Comment obtenir un devis personnalisé pour externaliser nos opérations ?', en: 'How do I obtain a tailored quotation to outsource operations?' },
  'ai.sug3': { fr: 'Intégration CRM', en: 'CRM Integration' },
  'ai.sug3_q': { fr: 'Quelles solutions CRM intégrez-vous (HubSpot, Salesforce, Zoho) ?', en: 'Which CRM solutions do you integrate (HubSpot, Salesforce, Zoho)?' },
  'ai.sug4': { fr: 'Coordonnées & Siège', en: 'Contact & Office' },
  'ai.sug4_q': { fr: 'Quelles sont vos coordonnées officielles, NIF et RCCM à Niamey ?', en: 'What are your official coordinates, NIF, and RCCM in Niamey?' },

  // Footer
  'footer.col_nav': { fr: 'Navigation', en: 'Navigation' },
  'footer.col_expertise': { fr: 'Pôles d’Expertise', en: 'Practice Areas' },
  'footer.col_legal': { fr: 'Informations Légales', en: 'Legal Information' },
  'footer.col_contact': { fr: 'Siège & Contact', en: 'Headquarters & Contact' },
  'footer.rights': { fr: 'Tous droits réservés.', en: 'All rights reserved.' },
  'footer.mentions': { fr: 'Mentions Légales & RCCM', en: 'Legal Notice & RCCM' },
  'footer.privacy': { fr: 'Protection des Données & Confidentialité', en: 'Data Protection & Privacy Policy' },
  'footer.theme_label': { fr: 'Thème du site :', en: 'Site theme:' },
  'footer.lang_label': { fr: 'Langue :', en: 'Language:' },

  // Language switcher UI
  'lang.switch_to_en': { fr: 'Switch to English (Passer en anglais)', en: 'English language active' },
  'lang.switch_to_fr': { fr: 'Langue française active', en: 'Passer en français (Switch to French)' },
  'lang.current': { fr: 'Français', en: 'English' },
  'lang.code_fr': { fr: 'FR', en: 'FR' },
  'lang.code_en': { fr: 'EN', en: 'EN' },

  // Theme switcher UI
  'theme.light': { fr: 'Mode clair', en: 'Light mode' },
  'theme.dark': { fr: 'Mode sombre', en: 'Dark mode' },
  'theme.to_light': { fr: 'Passer au mode clair', en: 'Switch to light mode' },
  'theme.to_dark': { fr: 'Passer au mode sombre', en: 'Switch to dark mode' },

  // Modal / Common
  'common.close': { fr: 'Fermer', en: 'Close' },
  'common.back': { fr: 'Retour', en: 'Back' },
  'common.back_to_site': { fr: 'Retour au site', en: 'Back to website' },
  'common.loading': { fr: 'Chargement...', en: 'Loading...' },
  'common.whatsapp_chat': { fr: 'Discuter sur WhatsApp', en: 'Chat on WhatsApp' },
  'common.call_us': { fr: 'Nous appeler', en: 'Call us' },

  // Toast / Feedback
  'lang.toast_en': { fr: '🇬🇧 Site traduit en anglais avec succès', en: '🇬🇧 Website successfully translated to English' },
  'lang.toast_fr': { fr: '🇫🇷 Site affiché en français', en: '🇫🇷 Website switched to French' },

  // About Page
  'about_page.badge': { fr: "À Propos d'Excellence Services SARL", en: 'About Excellence Services SARL' },
  'about_page.title': { fr: "L'alliance de l'expertise relationnelle et de la maîtrise technologique à Niamey.", en: 'The alliance of relationship expertise and technological mastery in Niamey.' },
  'about_page.mission_badge': { fr: 'Notre Mission Fondatrice', en: 'Our Founding Mission' },
  'about_page.mission_desc': { fr: "Basée à Niamey, au Niger, EXCELLENCE SERVICES SARL structure ses interventions autour d'une conviction fondamentale : la relation client n'est pas un simple centre de coûts, mais le moteur déterminant de la compétitivité et de la pérennité des entreprises.", en: 'Based in Niamey, Niger, EXCELLENCE SERVICES SARL structures its operations around a core belief: customer relationship is not merely a cost center, but the decisive engine of competitiveness and enterprise sustainability.' },
  'about_page.pillars_title': { fr: 'Nos 6 Piliers Fondamentaux', en: 'Our 6 Core Pillars' },
  'about_page.pillars_desc': { fr: 'Les valeurs qui guident chaque diagnostic, chaque déploiement et chaque échange avec vos usagers :', en: 'The values guiding every diagnosis, every deployment, and every interaction with your clients:' },
  'about_page.cta_title': { fr: 'Prêt à transformer votre relation client ?', en: 'Ready to transform your customer relationship?' },
  'about_page.cta_desc': { fr: 'Nos consultants à Niamey sont à votre écoute pour évaluer vos opportunités.', en: 'Our consultants in Niamey are at your disposal to assess your opportunities.' },
  'about_page.cta_btn': { fr: 'Demander une étude personnalisée', en: 'Request a customized study' },

  // Services Page
  'services_page.badge': { fr: "Catalogue d'Offres & Prestations", en: 'Service Catalog & Solutions' },
  'services_page.title': { fr: 'Des expertises pointues pour propulser votre expérience client.', en: 'Sharp expertise to elevate your customer experience.' },
  'services_page.desc': { fr: "De la gestion externalisée des centres de contact au conseil en CRM, en passant par le développement d'applications métiers et l'accélération e-commerce : explorez nos 8 domaines d'intervention stratégique.", en: 'From outsourced contact center management to CRM consulting, business app development, and e-commerce acceleration: explore our 8 strategic practice areas.' },
  'services_page.search_placeholder': { fr: "Rechercher une prestation (ex: CRM, centre d'appel, e-commerce)...", en: 'Search a service (e.g., CRM, call center, e-commerce)...' },
  'services_page.no_result': { fr: 'Aucun service ne correspond à votre recherche', en: 'No services match your search' },

  // Sectors Page
  'sectors_page.badge': { fr: 'Expertise Métier & Écosystèmes', en: 'Industry Expertise & Ecosystems' },
  'sectors_page.title': { fr: "Nos 5 secteurs d'intervention prioritaires", en: 'Our 5 Priority Practice Sectors' },
  'sectors_page.desc': { fr: 'De la micro-assurance aux projets de développement humanitaire et institutionnel, nous adaptons les canaux de contact, le CRM et les dispositifs digitaux aux réalités nigériennes et régionales.', en: 'From micro-insurance to humanitarian and institutional projects, we tailor contact channels, CRM, and digital platforms to Nigerien and regional realities.' },
  'sectors_page.cta_title': { fr: 'Votre secteur ne figure pas dans la liste ?', en: 'Your sector is not listed?' },
  'sectors_page.cta_desc': { fr: "Nos méthodologies de relation client et d'automatisation CRM s'appliquent à tous les contextes B2B et B2C.", en: 'Our customer relationship and CRM automation methodologies apply to all B2B and B2C environments.' },
  'sectors_page.cta_btn': { fr: 'Consulter nos spécialistes', en: 'Consult our specialists' },

  // Contact Page
  'contact_page.badge': { fr: 'Contact & Disponibilité', en: 'Contact & Availability' },
  'contact_page.title': { fr: 'Prenez contact avec notre direction commerciale à Niamey.', en: 'Get in touch with our commercial leadership in Niamey.' },
  'contact_page.desc': { fr: 'Nous sommes à votre disposition pour analyser vos besoins, planifier une démonstration de nos solutions ou établir une offre commerciale sur mesure.', en: 'We are available to evaluate your needs, schedule a solution demo, or prepare a tailored commercial proposal.' },
  'contact_page.form_title': { fr: 'Envoyez-nous un message', en: 'Send us a message' },
  'contact_page.subject': { fr: 'Objet de votre demande', en: 'Subject of your request' },
  'contact_page.subject_placeholder': { fr: 'Ex: Projet de centre d’appels, Intégration CRM...', en: 'E.g., Call center project, CRM integration...' },
  'contact_page.hours_label': { fr: 'Heures d’ouverture', en: 'Opening Hours' },
  'contact_page.hours_val': { fr: 'Lundi au Vendredi : 08h00 - 18h00 | Samedi : 09h00 - 13h00', en: 'Monday to Friday: 8:00 AM - 6:00 PM | Saturday: 9:00 AM - 1:00 PM' },

  // Quote Page
  'quote_page.badge': { fr: 'Demande de Chiffrage Express', en: 'Express Quotation Request' },
  'quote_page.title': { fr: 'Configurez votre devis personnalisé en 4 étapes simples.', en: 'Configure your customized quote in 4 simple steps.' },
  'quote_page.desc': { fr: 'Nos consultants étudient votre cahier des charges et vous remettent une proposition technique et financière sous 24 à 48 heures ouvrées.', en: 'Our consultants review your specifications and deliver a technical and financial proposal within 24 to 48 business hours.' },
  'quote_page.step1': { fr: 'Votre besoin', en: 'Your Need' },
  'quote_page.step2': { fr: 'Votre projet', en: 'Your Project' },
  'quote_page.step3': { fr: 'Vos informations', en: 'Your Details' },
  'quote_page.step4': { fr: 'Confirmation', en: 'Confirmation' },
  'quote_page.prev': { fr: 'Étape précédente', en: 'Previous step' },
  'quote_page.next': { fr: 'Continuer', en: 'Continue' },
  'quote_page.submit': { fr: 'Transmettre ma demande de devis', en: 'Submit my quote request' },
};
