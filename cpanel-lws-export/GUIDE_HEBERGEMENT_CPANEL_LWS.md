# Guide Officiel de Déploiement sur cPanel LWS — Excellence Services SARL

Ce dossier contient les fichiers de production prêts à être hébergés chez **LWS (Ligne Web Services)** sur un hébergement **cPanel**.

---

## 📦 Les 2 Packages Disponibles

Dans le dossier `cpanel-lws-export/`, vous disposez de 2 archives ZIP :

1. **`excellence-services-cpanel-public_html.zip` (Recommandé - Simple & Immédiat)** :
   * Idéal pour **95% des hébergements web cPanel LWS** (formules mutualisées Standard, Performance, cPanel Pro).
   * Contient le site web statique haute performance compilé avec toutes les images WebP responsive, les styles minifiés, le script du routeur et le fichier `.htaccess` configuré spécialement pour les serveurs Apache / LiteSpeed de LWS.
   * Fonctionne immédiatement sans aucune installation technique.

2. **`excellence-services-cpanel-nodejs.zip` (Option Avancée - Node.js App)** :
   * Pour les hébergements cPanel LWS disposant du module cPanel **"Setup Node.js App"** (Phusion Passenger / CloudLinux).
   * Contient le serveur Node.js / Express pré-compilé (`server.cjs`), le point d'entrée `app.js`, le fichier `package.json` de production et la configuration pour exécuter le proxy d'API Gemini et la compression dynamique côté serveur.

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

Votre site est maintenant en ligne, rapide et parfaitement fonctionnel ! 🎉
