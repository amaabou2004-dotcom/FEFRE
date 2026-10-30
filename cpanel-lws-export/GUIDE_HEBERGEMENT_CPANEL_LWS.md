# Guide Officiel de Déploiement sur cPanel LWS — Excellence Services SARL

Package généré le 2026-10-30 avec **Supabase déjà configuré**.

Ce dossier contient les fichiers de production prêts à être hébergés chez **LWS (Ligne Web Services)** sur un hébergement **cPanel**.

---

## 📦 Les 2 Packages Disponibles

Dans le dossier `cpanel-lws-export/`, vous disposez de 2 archives ZIP :

1. **`excellence-services-cpanel-public_html.zip` (Recommandé - Simple & Immédiat)** :
   * Idéal pour les hébergements cPanel LWS mutualisés Apache / LiteSpeed.
   * Contient le site statique compilé, les images, les styles minifiés et le fichier `.htaccess` de routage.
   * Fonctionne immédiatement sans installation Node.js ni création de base MySQL.

2. **`excellence-services-cpanel-nodejs.zip` (Option Avancée - Node.js App)** :
   * Pour les hébergements cPanel LWS disposant du module **"Setup Node.js App"** (Phusion Passenger / CloudLinux).
   * Contient le serveur Express pré-compilé (`server.cjs`), le point d'entrée `app.js` et le `package.json` de production.
   * Active en plus l'API serveur : IA Gemini optionnelle et optimisation d'images côté serveur.

**Choix conseillé : commencez par `excellence-services-cpanel-public_html.zip`.**

---

## 🗄️ Base Supabase déjà configurée — rien à importer sur LWS

- Projet Supabase déjà relié au site : `jwmgrsoxzkgpviglrrwm`.
- **Ne créez pas de base MySQL dans cPanel.**
- **N'importez aucun fichier SQL sur LWS.**
- **Aucune variable `VITE_SUPABASE_...` n'est à saisir dans cPanel** : la configuration publique de production est intégrée au build.
- Le navigateur du visiteur se connecte directement à Supabase Cloud. Réglages, services, secteurs, témoignages, FAQ, pages, médias, partenaires, projets/articles, demandes de devis, messages et journal d'activité restent donc synchronisés avec la base existante.
- L'administration reste sur `/admin`, avec **un seul champ mot de passe**. Utilisez le mot de passe administrateur actuel déjà créé dans Supabase ; il n'est pas écrit dans ce package.
- Une connexion Internet et le HTTPS sont nécessaires pour charger et synchroniser Supabase.
- N'ajoutez jamais de clé `service_role` ou `sb_secret...` dans le navigateur : le package utilise uniquement la clé publique protégée par les règles RLS.

---

## 🚀 Méthode 1 : Déploiement Standard dans `public_html/` (Recommandé)

### Étape 1 : Se connecter à votre cPanel LWS
1. Connectez-vous à votre espace client **LWS** (lws.fr).
2. Rendez-vous dans la rubrique **Mes Hébergements** > Cliquez sur **Gérer** en face de votre domaine.
3. Cliquez sur l'icône **cPanel** (ou connectez-vous via l'URL directe `https://votre-domaine.com:2083` avec vos identifiants cPanel LWS).

### Étape 2 : Ouvrir le Gestionnaire de Fichiers
1. Dans l'interface cPanel, cherchez la section **Fichiers** et cliquez sur **Gestionnaire de fichiers** (File Manager).
2. Dans l'arborescence à gauche, ouvrez le dossier **`public_html`** (c'est le dossier racine de votre site web public).
3. *Note importante :* Si `public_html` contient d'anciens fichiers (comme une page d'attente LWS `index.php` ou `default.html`), supprimez-les ou déplacez-les dans un sous-dossier de sauvegarde.

### Étape 3 : Téléverser et Extraire l'archive ZIP
1. Dans la barre d'outils en haut du Gestionnaire de fichiers, cliquez sur **Charger** (Upload).
2. Glissez-déposez le fichier **`excellence-services-cpanel-public_html.zip`**.
3. Une fois la barre verte à 100%, revenez dans le Gestionnaire de fichiers.
4. Sélectionnez le fichier `excellence-services-cpanel-public_html.zip` et cliquez sur **Extraire** (Extract) dans la barre supérieure.
5. Choisissez comme destination `/public_html` et validez l'extraction.
6. Une fois l'extraction terminée, vous pouvez supprimer le fichier `.zip` pour libérer de l'espace.

### Étape 4 : Vérifier la présence du fichier `.htaccess`
* Par défaut, cPanel masque les fichiers commençant par un point.
* En haut à droite du Gestionnaire de fichiers, cliquez sur **Paramètres** (Settings) > Cochez **"Afficher les fichiers masqués (dotfiles)"** > Cliquez sur **Save**.
* Vérifiez que le fichier **`.htaccess`** est bien présent à la racine de `public_html`. Ce fichier est capital car il gère :
  * Les redirections des routes React (`/services`, `/contact`, `/a-propos`, `/devis`, `/espace-partenaire`, etc.) vers `index.html` pour éviter toute erreur 404 lors du rechargement.
  * La compression Gzip/Deflate pour accélérer le site.
  * La mise en cache navigateur des images WebP et fichiers CSS/JS.
  * La redirection automatique vers HTTPS sécurisé.

### Étape 5 : Activer le certificat SSL Let's Encrypt (HTTPS Gratuit LWS)
1. Dans votre cPanel LWS, cherchez la section **Sécurité** > **SSL/TLS Status** ou **Let's Encrypt SSL**.
2. Sélectionnez votre nom de domaine et cliquez sur **Run AutoSSL** ou **Installer un certificat Let's Encrypt**.
3. En quelques minutes, le cadenas vert HTTPS sera actif sur votre site !

### Étape 6 : Vérifier le site et Supabase
1. Ouvrez `https://votre-domaine.com/` : la page d'accueil, les services et les contenus doivent provenir de Supabase.
2. Testez directement `https://votre-domaine.com/services`, `/contact`, `/devis` et `/admin` : aucun rechargement ne doit produire d'erreur 404 Apache.
3. Connectez-vous à `/admin` avec le mot de passe administrateur actuel. L'écran affiche l'état « Temps réel actif » lorsque Supabase Realtime est connecté.
4. Envoyez un message de contact ou une demande de devis de test, puis vérifiez sa présence dans l'administration.
5. Testez l'assistant IA : sur cet hébergement statique, il répond en mode local à partir des informations vérifiées chargées depuis Supabase, sans clé Gemini.
6. Si vous utilisez `https://votre-domaine.com/test-lws.php` pour le diagnostic, **supprimez `public_html/test-lws.php` juste après** : ce fichier affiche des informations techniques du serveur.

Votre site statique est alors en ligne et déjà relié à Supabase. 🎉

---

## ⚙️ Méthode 2 : Déploiement Node.js / Passenger (option avancée)

Utilisez cette méthode uniquement si cPanel affiche **Setup Node.js App**. Le package statique reste plus simple pour LWS mutualisé.

### Étape 1 : Déposer les fichiers hors de `public_html`
1. Dans le Gestionnaire de fichiers cPanel, créez par exemple le dossier `/home/VOTRE_COMPTE/excellence-services-app` (en dehors de `public_html`).
2. Téléversez `excellence-services-cpanel-nodejs.zip` dans ce dossier, puis extrayez-le **dans ce même dossier**.
3. Vérifiez que `app.js`, `package.json` et `dist/server.cjs` sont présents à cet emplacement, puis supprimez le ZIP.

### Étape 2 : Créer l'application Node.js dans cPanel
1. Ouvrez **Logiciel > Setup Node.js App > Create Application**.
2. Choisissez **Node.js 20** si disponible (minimum Node.js 18).
3. Mode d'application : **Production**.
4. Racine de l'application : `excellence-services-app` (le dossier contenant `app.js`).
5. URL de l'application : votre domaine principal (ou le sous-domaine souhaité).
6. Fichier de démarrage : `app.js`.
7. Cliquez sur **Create**.

### Étape 3 : Installer les dépendances et démarrer
1. Dans l'écran de l'application, cliquez sur **Run NPM Install**.
2. Ajoutez uniquement les variables d'environnement utiles au serveur Node :
   - `NODE_ENV` = `production` (déjà forcé par `app.js`)
   - `GEMINI_API_KEY` = votre clé Gemini **optionnelle** pour enrichir l'IA via `/api/ai/chat`
   - `GEMINI_MODEL` = modèle Gemini optionnel (laisser vide pour le modèle par défaut)
3. **N'ajoutez aucune variable Supabase** : le front utilise déjà la configuration publique Supabase du build, et le serveur Express n'en a pas besoin.
4. Ne définissez pas de port fixe dans cPanel si Passenger le gère automatiquement ; `app.js` utilise le port fourni par l'hébergeur.
5. Cliquez sur **Restart**.
6. Vérifiez `https://votre-domaine.com/api/health`, puis la page d'accueil, `/admin`, un formulaire et l'assistant IA.

Sans `GEMINI_API_KEY`, l'API Node répond déjà avec la connaissance vérifiée locale. Si l'installation des dépendances échoue sur l'hébergement mutualisé, revenez simplement au package `public_html` : le site et Supabase continueront de fonctionner.

---

## 🔄 Mettre à jour le site plus tard

1. Générez un nouveau package depuis le code à jour.
2. Sauvegardez l'ancien dossier du site dans cPanel.
3. Extrayez le nouveau ZIP au même endroit en remplaçant `index.html`, `assets/` et les autres fichiers du site.
4. Vérifiez la présence du nouveau `.htaccess` en méthode statique, ou redémarrez l'application après `Run NPM Install` en méthode Node.js.
5. **La base Supabase n'est pas effacée par une mise à jour des fichiers LWS** : contenus et demandes restent en ligne dans Supabase Cloud.

---

## 🛠️ Dépannage rapide

| Symptôme | Vérification |
|---|---|
| Page blanche ou site sous `/public_html/...` imprévu | Le ZIP doit être extrait de façon à avoir `public_html/index.html` et `public_html/assets/`, sans dossier intermédiaire supplémentaire. |
| Erreur 404 au rechargement de `/services` ou `/admin` | Affichez les fichiers masqués et vérifiez `public_html/.htaccess`. |
| Le site s'ouvre mais les contenus semblent anciens | Vérifiez la connexion Internet/HTTPS, videz le cache du navigateur, puis reconnectez-vous à `/admin` et contrôlez la mention de synchronisation. |
| Mot de passe admin refusé | Utilisez exactement le mot de passe Supabase actuel, en respectant majuscules/minuscules. Il ne se change pas dans les fichiers LWS. |
| L'IA répond sans mention Gemini en statique | C'est normal : le package `public_html` utilise la connaissance locale vérifiée. La clé Gemini ne concerne que la méthode Node.js/Netlify. |
| `Cannot find module` en Node.js | Cliquez sur **Run NPM Install** dans Setup Node.js App, vérifiez Node.js 18+ (20 conseillé), puis **Restart**. |
| La page `/telechargement` du site statique ne retrouve pas les ZIP | Les archives cPanel sont des livrables externes fournis avec ce guide ; conservez-les séparément plutôt que de les republier dans le site déployé. |

## 🔐 Sécurité après installation

- Supprimez le ZIP d'installation de `public_html` après extraction.
- Supprimez `test-lws.php` après tout diagnostic.
- Activez le HTTPS et conservez les sauvegardes cPanel.
- Ne placez jamais de clé secrète Supabase ou Gemini dans les fichiers publics : Gemini se saisit uniquement dans les variables d'environnement Node.js de cPanel.
