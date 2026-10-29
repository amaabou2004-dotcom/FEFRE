import os
import shutil
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")
PUBLIC = os.path.join(ROOT, "public")

# 1. Output directory for cPanel packages
CPANEL_OUT = os.path.join(ROOT, "cpanel-lws-export")
if os.path.exists(CPANEL_OUT):
    shutil.rmtree(CPANEL_OUT)
os.makedirs(CPANEL_OUT, exist_ok=True)

# ------------------------------------------------------------------------------
# GUIDE DE DÉPLOIEMENT
# ------------------------------------------------------------------------------
GUIDE_CONTENT = """# Guide Officiel de Déploiement sur cPanel LWS — Excellence Services SARL

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
"""

with open(os.path.join(CPANEL_OUT, "GUIDE_HEBERGEMENT_CPANEL_LWS.md"), "w", encoding="utf-8") as f:
    f.write(GUIDE_CONTENT)

# ------------------------------------------------------------------------------
# PACKAGE 1: public_html (Hébergement standard Apache cPanel LWS)
# ------------------------------------------------------------------------------
PUBLIC_HTML_DIR = os.path.join(CPANEL_OUT, "public_html")
os.makedirs(PUBLIC_HTML_DIR, exist_ok=True)

# Copy all static assets from dist except server.cjs, map, and downloads
for item in os.listdir(DIST):
    if item in ["server.cjs", "server.cjs.map", "downloads"]:
        continue
    src = os.path.join(DIST, item)
    dst = os.path.join(PUBLIC_HTML_DIR, item)
    if os.path.isdir(src):
        shutil.copytree(src, dst)
    else:
        shutil.copy2(src, dst)

# Ensure .htaccess is present
htaccess_src = os.path.join(DIST, ".htaccess")
htaccess_dst = os.path.join(PUBLIC_HTML_DIR, ".htaccess")
if os.path.exists(htaccess_src) and not os.path.exists(htaccess_dst):
    shutil.copy2(htaccess_src, htaccess_dst)

# Add guide inside public_html
with open(os.path.join(PUBLIC_HTML_DIR, "README_CPANEL.txt"), "w", encoding="utf-8") as f:
    f.write("Extrayez l'integralite de ce contenu dans /public_html de votre cPanel LWS.\nConsultez le fichier .htaccess pour les redirections React SPA.")

# Create ZIP for public_html
zip_public_path = os.path.join(CPANEL_OUT, "excellence-services-cpanel-public_html.zip")
with zipfile.ZipFile(zip_public_path, "w", zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(PUBLIC_HTML_DIR):
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, PUBLIC_HTML_DIR)
            z.write(full_path, rel_path)

# ------------------------------------------------------------------------------
# PACKAGE 2: Node.js cPanel LWS (Setup Node.js App)
# ------------------------------------------------------------------------------
NODEJS_DIR = os.path.join(CPANEL_OUT, "nodejs-app")
os.makedirs(NODEJS_DIR, exist_ok=True)

# Copy dist entirely into nodejs-app/dist (ignoring downloads)
def ignore_downloads(dirpath, contents):
    return ["downloads"] if "downloads" in contents else []

shutil.copytree(DIST, os.path.join(NODEJS_DIR, "dist"), ignore=ignore_downloads)

# Create app.js (Passenger entrypoint for cPanel)
with open(os.path.join(NODEJS_DIR, "app.js"), "w", encoding="utf-8") as f:
    f.write("""// ==============================================================================
// EXCELLENCE SERVICES SARL — Point d'entrée Node.js cPanel LWS (Phusion Passenger)
// ==============================================================================
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || 3000;

// Démarrage du serveur Express pré-compilé
require('./dist/server.cjs');
""")

# Create production package.json
with open(os.path.join(NODEJS_DIR, "package.json"), "w", encoding="utf-8") as f:
    f.write("""{
  "name": "excellence-services-cpanel",
  "version": "1.0.0",
  "description": "Excellence Services SARL - Serveur Node.js de production pour cPanel LWS",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "@google/genai": "^2.22.0",
    "compression": "^1.8.0",
    "express": "^5.2.1",
    "sharp": "^0.35.4"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
""")

# Create .env.example
with open(os.path.join(NODEJS_DIR, ".env.example"), "w", encoding="utf-8") as f:
    f.write("""# Clé API Google Gemini pour le conseiller virtuel d'Excellence Services
GEMINI_API_KEY=votre_cle_gemini_ici
NODE_ENV=production
PORT=3000
""")

# Create ZIP for nodejs-app
zip_nodejs_path = os.path.join(CPANEL_OUT, "excellence-services-cpanel-nodejs.zip")
with zipfile.ZipFile(zip_nodejs_path, "w", zipfile.ZIP_DEFLATED) as z:
    for root, dirs, files in os.walk(NODEJS_DIR):
        for f in files:
            full_path = os.path.join(root, f)
            rel_path = os.path.relpath(full_path, NODEJS_DIR)
            z.write(full_path, rel_path)

# Clean and sync archives into public/downloads and dist/downloads
for target_dir in [os.path.join(ROOT, "public", "downloads"), os.path.join(ROOT, "dist", "downloads")]:
    os.makedirs(target_dir, exist_ok=True)
    shutil.copy2(zip_public_path, os.path.join(target_dir, "excellence-services-cpanel-public_html.zip"))
    shutil.copy2(zip_nodejs_path, os.path.join(target_dir, "excellence-services-cpanel-nodejs.zip"))

print("PACKAGING SUCCESS:")
print("1. Archive public_html (Standard) :", zip_public_path, f"({os.path.getsize(zip_public_path) / 1024:.1f} KB)")
print("2. Archive Node.js (Avancé)        :", zip_nodejs_path, f"({os.path.getsize(zip_nodejs_path) / 1024:.1f} KB)")
print("Direct download ready at /downloads/excellence-services-cpanel-public_html.zip")
