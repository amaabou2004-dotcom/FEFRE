# Excellence Services SARL — Package Node.js cPanel LWS

Généré le 2026-10-30. **Supabase est déjà configuré** (projet `jwmgrsoxzkgpviglrrwm`) : ne créez pas de base MySQL, n'importez aucun SQL et ne saisissez aucune variable Supabase sur LWS.

## Installation rapide

1. Extrayez ce ZIP dans un dossier d'application hors de `public_html`, par exemple `excellence-services-app`.
2. Dans cPanel, ouvrez **Setup Node.js App > Create Application**.
3. Choisissez Node.js 20 (minimum 18), mode **Production**, racine = le dossier contenant `app.js`, fichier de démarrage = `app.js`.
4. Cliquez sur **Run NPM Install**, puis **Restart**.
5. Variables optionnelles uniquement : `GEMINI_API_KEY` et `GEMINI_MODEL` pour l'IA serveur. `NODE_ENV=production` est déjà géré par `app.js`.
6. Testez `/api/health`, la page d'accueil, `/admin`, un formulaire et l'assistant IA.

Le mot de passe administrateur actuel reste géré par Supabase et n'est pas contenu dans ce package.
Pour un hébergement mutualisé simple, préférez le ZIP `public_html` fourni avec le guide complet.
