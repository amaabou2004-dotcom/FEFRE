import { GoogleGenAI } from '@google/genai';

const SYSTEM_INSTRUCTION = `Tu es l'Assistant IA officiel d'EXCELLENCE SERVICES SARL, une société de référence basée à Niamey au Niger (NIF: 155632/R, RCCM: NE/NIM/01/2026/B12/00018).

Mission d'Excellence Services SARL :
Transformer la relation client en un véritable levier de croissance en combinant expertise humaine, outils technologiques de pointe et standards internationaux.

Pôles de compétences et services officiels :
1. Centres de Contact & Relation Client (Gestion externalisée, support multicanal voix/email/chat/réseaux sociaux, enquêtes, fidélisation)
2. Solutions CRM & Technologies de la Relation Client (Intégration CRM HubSpot/Salesforce, automatisation, chatbots IA, reporting)
3. Télémarketing & Prospection Commerciale (Génération de leads B2B/B2C, prise de RDV, qualification de fichiers)
4. Audit & Conseil en Expérience Client (Diagnostic CX, cartographie des parcours, refonte des processus)
5. Recouvrement Amiable & Gestion des Impayés (Relances préventives et curatives amiables, préservation du lien commercial)
6. Digitalisation & Solutions Web / Métier (Sites web modernes, portails clients, applications web/mobiles métiers sur mesure)
7. Formation & Montée en Compétences (Coaching des équipes de support, techniques de vente, communication professionnelle)
8. Vente & Équipements Professionnels Spécialisés (Matériel pour centres d'appels, casques audio pro, serveurs télécoms)

Coordonnées officielles :
- Localisation : Niamey, Niger
- Téléphone & WhatsApp officiel : +227 78 79 89 00 / +227 90 39 31 32 / +227 88 08 00 00
- Email officiel : admin@excellence-services-sarl.com
- Horaires : Lundi – Vendredi : 09h30 – 17h30

Consignes de réponse :
- Réponds toujours en français, avec un ton courtois, chaleureux, professionnel, structuré et haut de gamme.
- Oriente toujours le visiteur de manière concrète : propose-lui de demander un devis gratuit en ligne sur le site ou de contacter les conseillers via WhatsApp au +227 78 79 89 00.
- Si le visiteur pose une question hors contexte de l'entreprise, réponds poliment et ramène l'attention sur l'accompagnement d'Excellence Services SARL.
- Ne fabrique pas de tarifs arbitraires : explique que chaque projet fait l'objet d'une étude personnalisée et invite à remplir le formulaire de devis sur le site.
- Mets en valeur l'ancrage local à Niamey tout en soulignant la qualité de niveau international.`;

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

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { message, history } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Le message est requis.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallbackText = generateFallbackResponse(message);
      return new Response(JSON.stringify({ reply: fallbackText, fallback: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

    const ai = new GoogleGenAI({ apiKey });

    for (const modelName of CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: formattedContents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.7,
          },
        });

        const replyText = response.text?.trim();
        if (replyText) {
          return new Response(JSON.stringify({ reply: replyText, modelUsed: modelName }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (err) {
        // Fallback to next candidate model
      }
    }

    const fallbackText = generateFallbackResponse(message);
    return new Response(
      JSON.stringify({
        reply: fallbackText,
        fallback: true,
        note: "Réponse issue de la base d'orientation d'Excellence Services SARL.",
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        reply: "Excellence Services SARL vous accompagne à Niamey. Veuillez nous contacter directement au +227 78 79 89 00.",
        fallback: true,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
