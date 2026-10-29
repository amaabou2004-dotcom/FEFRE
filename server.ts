import express from 'express';
import path from 'path';
import fs from 'fs';
import compression from 'compression';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { handleImageTransform, handleImageTransformPost } from './server/imageService';

const app = express();
const PORT = process.env.PORT ? parseInt(String(process.env.PORT), 10) : 3000;

// Enable HTTP response compression (gzip / brotli) for all text, JS, CSS, JSON, HTML
app.use(
  compression({
    threshold: 1024,
  })
);

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const SYSTEM_INSTRUCTION = `Tu es le Conseiller Virtuel officiel et l'Intelligence Métier exclusive d'EXCELLENCE SERVICES SARL, entreprise de référence basée à Niamey au Niger (NIF: 155632/R, RCCM: NE/NIM/01/2026/B12/00018).

Mission d'Excellence Services SARL :
Transformer la relation client, le support utilisateur et la performance commerciale en leviers de croissance majeurs pour les entreprises, institutions, banques, ONG et commerces au Niger et dans l'espace UEMOA/Afrique de l'Ouest.

Pôles de compétences et services officiels :
1. Centres de Contact & Relation Client (Gestion externalisée 24/7, support multicanal voix, email, chat, WhatsApp Business et réseaux sociaux, enquêtes de satisfaction, fidélisation)
2. Solutions CRM & Technologies de la Relation Client (Intégration et paramétrage de HubSpot, Salesforce, Zoho ou plateformes sur mesure, automatisation des relances, dashboards de KPIs en temps réel)
3. Télémarketing & Prospection Commerciale (Génération de leads qualifiés B2B/B2C, qualification de bases de données, prise de rendez-vous qualifiés, télévente)
4. Audit & Conseil en Expérience Client (Diagnostic CX approfondi, cartographie des parcours clients, refonte de processus opérationnels, grilles d'évaluation qualité)
5. Recouvrement Amiable & Gestion des Impayés (Relances préventives, gestion des retards d'échéances et recouvrement négocié respectant l'éthique et préservant le lien commercial)
6. Digitalisation & Solutions Web / Métier (Création de sites web professionnels, portails clients interactifs, intranets et applications web/mobiles adaptées au contexte africain)
7. Formation & Montée en Compétences (Programmes certifiants pour téléconseillers, superviseurs de plateau, agents d'accueil et commerciaux)
8. Vente & Équipements Professionnels Spécialisés (Matériel télécoms agréé pour call centers, casques réducteurs de bruit professionnels, serveurs de téléphonie VoIP et stations de travail)

Coordonnées officielles :
- Localisation : Niamey, Niger
- Téléphones officiels : +227 78 79 89 00 / +227 90 39 31 32 / +227 88 08 00 00
- WhatsApp Business direct : +227 78 79 89 00
- Email officiel : admin@excellence-services-sarl.com
- Horaires d'ouverture des bureaux : Lundi au Vendredi : 09h30 – 17h30 (astreinte et supervision centre de contact 24/7)

Règles de comportement :
- Ton : Chaleureux, professionnel, haut de gamme, précis et orienté solutions.
- RÈGLE ABSOLUE D'IDENTITÉ : Tu es le Conseiller Virtuel officiel développé pour Excellence Services SARL. Ne mentionne JAMAIS Google, Gemini ou tout autre fournisseur d'IA.
- Clarté et concision : Fournis des réponses bien structurées (points clés en liste à puces ou numérotée si pertinent, sans blocs de texte interminables).
- Appel à l'action concret : Quand l'interlocuteur a un projet ou souhaite connaître les coûts, oriente-le vers le formulaire de devis en ligne sur le site ou vers un échange direct sur WhatsApp avec notre direction commerciale (+227 78 79 89 00).
- Contexte local et sous-régional : Tu maîtrises les réalités économiques de Niamey, du Niger et de la sous-région ouest-africaine (télécoms, microfinance, secteur public, ONG, commerce).`;

// Helper to sanitize responses and strip any accidental external AI signature
function sanitizeResponse(text: string): string {
  if (!text) return text;
  let cleaned = text
    // Remove explicit signatures or footers
    .replace(/(?:---|___|\*\*\*)\s*(?:Généré par|Propulsé par|Powered by|Modèle|IA|Gemini)[\s\S]*$/gi, '')
    .replace(/\*?\*?(?:Généré par|Propulsé par|Powered by)\s+Gemini[\s\S]*?\*?\*?/gi, '')
    .replace(/\b(?:Google\s+)?Gemini(?:\s+(?:Flash|Pro|Ultra|Live|Nano|Advanced))?\b/gi, "Conseiller Virtuel Excellence Services")
    .replace(/\b(?:Google\s+AI|OpenAI|ChatGPT|Anthropic|Claude)\b/gi, "Excellence Services")
    .replace(/modèle\s+de\s+langage\s+(?:de\s+Google|développé\s+par\s+Google)/gi, "système d'orientation d'Excellence Services")
    .replace(/développé\s+par\s+Google/gi, "conçu pour Excellence Services SARL")
    .replace(/grand\s+modèle\s+linguistique/gi, "assistant professionnel")
    .replace(/intelligence\s+artificielle\s+créée\s+par\s+Google/gi, "conseiller digital d'Excellence Services SARL");
  return cleaned.trim();
}

function detectIntent(userText: string, botReply: string) {
  const combined = `${userText} ${botReply}`.toLowerCase();
  const needsQuote =
    combined.includes('devis') ||
    combined.includes('chiffrage') ||
    combined.includes('tarif') ||
    combined.includes('coût') ||
    combined.includes('prix') ||
    combined.includes('budget');

  const needsContact =
    combined.includes('whatsapp') ||
    combined.includes('téléphone') ||
    combined.includes('joindre') ||
    combined.includes('contacter') ||
    combined.includes('rendez-vous') ||
    combined.includes('rdv');

  return {
    needsQuote,
    needsContact,
  };
}

// Candidate models ordered by speed, low latency and resilience:
// 'gemini-3.1-flash-lite' has high throughput and minimal queuing spikes,
// followed by 'gemini-3.8-flash', 'gemini-flash-latest', and 'gemini-3.1-pro-preview'.
// Deprecated models like gemini-2.5-flash or 1.5/2.0 are avoided.
const CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-pro-preview',
];

function generateFallbackResponse(userPrompt: string): string {
  const query = userPrompt.toLowerCase();
  if (query.includes('devis') || query.includes('tarif') || query.includes('prix') || query.includes('coût')) {
    return "Pour obtenir une proposition financière ou un devis personnalisé adapté aux besoins de votre entreprise, nous vous invitons à remplir notre formulaire de devis en ligne sur le site, ou à échanger directement avec notre équipe commerciale via WhatsApp ou téléphone au +227 78 79 89 00.";
  }
  if (query.includes('contact') || query.includes('adresse') || query.includes('niamey') || query.includes('telephone') || query.includes('whatsapp') || query.includes('mail')) {
    return "Excellence Services SARL est implantée à Niamey, Niger (NIF: 155632/R, RCCM: NE/NIM/01/2026/B12/00018).\n\nNos coordonnées officielles :\n- Téléphone & WhatsApp : +227 78 79 89 00 / +227 90 39 31 32 / +227 88 08 00 00\n- Email : admin@excellence-services-sarl.com\n- Disponibilité : Lundi à Vendredi, 09h30 à 17h30";
  }
  if (query.includes('crm') || query.includes('hubspot') || query.includes('salesforce')) {
    return "Nous vous accompagnons dans l'intégration et l'optimisation des solutions CRM (HubSpot, Salesforce, Zoho, solutions sur mesure) : paramétrage des pipelines commerciaux, automatisation des relances, création de tableaux de bord de performance et formation continue de vos équipes.";
  }
  if (query.includes('recouvrement') || query.includes('impayé') || query.includes('dette')) {
    return "Notre service de Recouvrement Amiable prend en charge vos impayés grâce à une approche graduée et éthique qui préserve vos relations commerciales tout en accélérant vos encaissements (relances préventives, échéanciers négociés, tableaux de suivi en temps réel).";
  }
  if (query.includes('web') || query.includes('site') || query.includes('digital') || query.includes('application') || query.includes('logiciel')) {
    return "Notre pôle Digital & Solutions Web conçoit des plateformes modernes, des portails clients sécurisés et des applications métiers personnalisées pour accélérer la transformation digitale de votre organisation.";
  }
  if (query.includes('formation') || query.includes('coaching') || query.includes('competence')) {
    return "Nous dispensons des formations pratiques et certifiantes pour vos téléconseillers, superviseurs et équipes commerciales : techniques d'accueil téléphonique, gestion des réclamations complexes, télévente persuasive et maîtrise des outils CRM.";
  }
  if (query.includes('service') || query.includes('prestation') || query.includes('centre') || query.includes('appel')) {
    return "Excellence Services SARL propose 8 pôles d'expertise clés :\n1. Centres de Contact & Relation Client externalisée (support multicanal 24/7)\n2. Solutions CRM & Automatisation\n3. Télémarketing & Prospection Commerciale\n4. Audit & Conseil en Expérience Client (CX)\n5. Recouvrement Amiable & Gestion des Impayés\n6. Digitalisation & Solutions Web / Métier\n7. Formation & Montée en Compétences\n8. Équipements Professionnels Spécialisés\n\nN'hésitez pas à demander un devis gratuit pour votre projet !";
  }
  return "Bonjour ! Je suis l'Assistant IA d'Excellence Services SARL à Niamey. Nous sommes à votre disposition pour vous accompagner dans vos projets de relation client, centre d'appels, CRM et digitalisation. Vous pouvez nous poser une question précise, demander un devis en ligne ou nous joindre directement au +227 78 79 89 00.";
}

// Direct download endpoints for cPanel LWS packages
app.get(['/download/cpanel', '/download/cpanel-public_html', '/download/excellence-services-cpanel-public_html.zip', '/downloads/excellence-services-cpanel-public_html.zip'], (req, res) => {
  const candidatePaths = [
    path.join(process.cwd(), 'cpanel-lws-export', 'excellence-services-cpanel-public_html.zip'),
    path.join(process.cwd(), 'public', 'downloads', 'excellence-services-cpanel-public_html.zip'),
    path.join(process.cwd(), 'dist', 'downloads', 'excellence-services-cpanel-public_html.zip'),
  ];
  const found = candidatePaths.find((p) => fs.existsSync(p));
  if (found) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="excellence-services-cpanel-public_html.zip"');
    return res.sendFile(found);
  }
  return res.status(404).send("Archive non trouvée. Veuillez exécuter 'npm run build:cpanel'.");
});

app.get(['/download/cpanel-nodejs', '/download/excellence-services-cpanel-nodejs.zip', '/downloads/excellence-services-cpanel-nodejs.zip'], (req, res) => {
  const candidatePaths = [
    path.join(process.cwd(), 'cpanel-lws-export', 'excellence-services-cpanel-nodejs.zip'),
    path.join(process.cwd(), 'public', 'downloads', 'excellence-services-cpanel-nodejs.zip'),
    path.join(process.cwd(), 'dist', 'downloads', 'excellence-services-cpanel-nodejs.zip'),
  ];
  const found = candidatePaths.find((p) => fs.existsSync(p));
  if (found) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="excellence-services-cpanel-nodejs.zip"');
    return res.sendFile(found);
  }
  return res.status(404).send("Archive Node.js non trouvée. Veuillez exécuter 'npm run build:cpanel'.");
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Image Transformation and WebP Optimization Service
app.get('/api/images/transform', handleImageTransform);
app.get('/api/images/optimize', handleImageTransform);
app.post('/api/images/transform', handleImageTransformPost);
app.post('/api/images/optimize', handleImageTransformPost);

app.post('/api/ai/chat', async (req, res) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Le message est requis.' });
  }

  // Format chat messages
  const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  if (Array.isArray(history)) {
    for (const item of history.slice(-6)) {
      if (item.sender === 'user' && item.text) {
        formattedContents.push({ role: 'user', parts: [{ text: String(item.text) }] });
      } else if (item.sender === 'bot' && item.text) {
        formattedContents.push({ role: 'model', parts: [{ text: String(item.text) }] });
      }
    }
  }

  formattedContents.push({ role: 'user', parts: [{ text: message }] });

  // If no Gemini API key is configured, reply with the structured contextual fallback directly
  if (!process.env.GEMINI_API_KEY) {
    const fallbackText = generateFallbackResponse(message);
    return res.json({ reply: fallbackText, fallback: true });
  }

  let lastError: any = null;

  // Try models in succession (e.g. gemini-3.8-flash, then gemini-2.5-flash, gemini-flash-latest, etc.)
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: modelName,
        contents: formattedContents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      const rawReply = response.text?.trim();
      if (rawReply) {
        const replyText = sanitizeResponse(rawReply);
        return res.json({
          reply: replyText,
          modelUsed: 'excellence-ai',
          intent: detectIntent(message, replyText),
        });
      }
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.code || err?.error?.code;
      console.warn(`[Gemini API] Model ${modelName} returned error (${status || 'unknown'}): ${err?.message || err}. Trying next fallback model...`);
      // Continue to next candidate model
    }
  }

  // If all models encounter rate limit or temporary 503 high demand spike, provide contextual answer
  console.error('[Gemini API] All candidate models encountered high demand or errors. Providing resilient knowledge fallback.', lastError?.message || lastError);
  const fallbackText = generateFallbackResponse(message);
  return res.json({
    reply: fallbackText,
    fallback: true,
    intent: detectIntent(message, fallbackText),
    note: "Réponse basée sur la base de connaissances officielle d'Excellence Services SARL.",
  });
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(
      express.static(distPath, {
        maxAge: '1y',
        immutable: true,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            // HTML should always revalidate so users instantly receive new releases
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
          } else if (/\.(js|css|webp|png|jpg|jpeg|svg|woff2|ico)$/i.test(filePath)) {
            // Hashed JS, CSS, and optimized images can be cached for 1 year
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );
    app.get('*all', (req, res) => {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
