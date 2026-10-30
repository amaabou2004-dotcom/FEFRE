import assert from 'node:assert/strict';
import {
  buildKnowledgeFallbackReply,
  DEFAULT_AI_CONTEXT,
  validateAIResponse,
} from '../src/lib/aiAssistant.ts';
import { handleAIChatRequest } from '../server/aiChat.ts';

const ctx = DEFAULT_AI_CONTEXT;

function fallback(message: string, language: 'fr' | 'en' = 'fr', history: any[] = [], surface: 'page' | 'floating' = 'page') {
  return buildKnowledgeFallbackReply(message, ctx, language, history, surface).reply;
}

const services = fallback('Quels sont vos services ?');
assert.match(services, /Conseil, Audit & Stratégie Client/);
assert.match(services, /E-commerce & Plateformes de Vente/);
assert.doesNotMatch(services, /Recouvrement Amiable|Télémarketing, Prospection|Équipements Professionnels/);

const contacts = fallback('Quelles sont vos coordonnées officielles, NIF et RCCM ?');
assert.match(contacts, /\+227 78 79 89 00/);
assert.match(contacts, /155632\/R/);
assert.match(contacts, /NE\/NIM\/01\/2026\/B12\/00018/);
assert.match(contacts, /09h30 – 17h30/);

const hours = fallback('What are your office hours?', 'en');
assert.match(hours, /published office hours/i);
assert.match(hours, /9:30 AM/);
assert.doesNotMatch(hours, /8:00 AM - 6:00 PM/);

const price = fallback('Combien coûte la création d’un site web ?');
assert.match(price, /Aucun tarif fixe/);
assert.doesNotMatch(price, /FCFA|€|\$\s?\d/);

const crm = fallback('Quelles solutions CRM intégrez-vous : HubSpot, Salesforce ou Zoho ?');
assert.match(crm, /ne sont pas nommément confirmées/);
assert.doesNotMatch(crm, /nous intégrons HubSpot/i);

const recovery = fallback('Faites-vous du recouvrement amiable ?');
assert.match(recovery, /ne figure pas comme pôle distinct|ne trouve pas de réponse suffisamment fiable/);
assert.doesNotMatch(recovery, /Notre service de Recouvrement Amiable prend en charge/);

const shop = fallback('Puis-je acheter des équipements dans votre boutique ?');
assert.match(shop, /en préparation/);

const followUp = fallback('Et combien ça coûte ?', 'fr', [{ sender: 'user', text: 'Je veux une application mobile pour mon entreprise.' }]);
assert.match(followUp, /Aucun tarif fixe/);

const training = fallback('Pouvez-vous former nos équipes internes à la relation client ?');
assert.match(training, /modules certifiants/);

assert.equal(validateAIResponse('Appelez-nous au +227 11 22 33 44.', ctx).ok, false);
assert.equal(validateAIResponse('Le service coûte 500000 FCFA.', ctx).ok, false);
assert.equal(validateAIResponse('Notre support est disponible 24/7.', ctx).ok, false);
assert.equal(validateAIResponse('Contactez-nous au +227 78 79 89 00.', ctx).ok, true);

const handlerResult = await handleAIChatRequest(
  {
    message: 'Quels sont vos services ?',
    language: 'fr',
    surface: 'floating',
    history: [],
  },
  { apiKey: '', clientIp: 'test-local' },
);
assert.equal(handlerResult.status, 200);
assert.equal(handlerResult.body.source, 'knowledge');
assert.match(String(handlerResult.body.reply), /Transformation Numérique des Entreprises/);

const currentContext = { ...ctx, currentPage: '/services/digital-web-applications' };
const currentPrice = buildKnowledgeFallbackReply('Combien ça coûte ?', currentContext, 'fr', [], 'floating').reply;
assert.match(currentPrice, /Digital, Web & Applications/);
const currentDelay = buildKnowledgeFallbackReply('Quel est le délai de mise en place de ce service ?', currentContext, 'fr', [], 'floating').reply;
assert.match(currentDelay, /ne mentionnent pas de délai/);
assert.doesNotMatch(currentDelay, /5 et 15 jours/);

console.log('AI knowledge tests passed');
console.log('\n--- Services floating sample ---\n', fallback('Quels sont vos services ?', 'fr', [], 'floating'));
console.log('\n--- Recovery sample ---\n', recovery);
