// ==============================================================================
// EXCELLENCE SERVICES SARL — Point d'entrée Node.js cPanel LWS (Phusion Passenger)
// ==============================================================================
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || 3000;

// Démarrage du serveur Express pré-compilé
require('./dist/server.cjs');
