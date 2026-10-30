import json
import os
import re
import shutil
import zipfile
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")
PUBLIC = os.path.join(ROOT, "public")
BUILD_DATE = date.today().isoformat()

# ------------------------------------------------------------------------------
# Contrôles avant empaquetage
# ------------------------------------------------------------------------------
# Le package LWS doit contenir le site Supabase actuel, jamais un ancien
# export Firebase. On échoue immédiatement si le build est absent/incohérent.
required_dist_files = [
    os.path.join(DIST, "index.html"),
    os.path.join(DIST, ".htaccess"),
    os.path.join(DIST, "server.cjs"),
]
missing_dist_files = [path for path in required_dist_files if not os.path.isfile(path)]
if missing_dist_files:
    missing_list = "\n - ".join(missing_dist_files)
    raise SystemExit(
        "Build de production incomplet. Exécutez d'abord `npm run build`.\n"
        f"Fichiers manquants :\n - {missing_list}"
    )

supabase_source = ""
with open(os.path.join(ROOT, "src", "lib", "supabase.ts"), encoding="utf-8") as f:
    supabase_source = f.read()

supabase_url_match = re.search(r"DEFAULT_SUPABASE_URL\s*=\s*'([^']+)'", supabase_source)
supabase_key_match = re.search(r"DEFAULT_SUPABASE_PUBLISHABLE_KEY\s*=\s*'([^']+)'", supabase_source)
if not supabase_url_match or not supabase_key_match:
    raise SystemExit("Configuration Supabase publique introuvable dans src/lib/supabase.ts")

SUPABASE_URL = supabase_url_match.group(1)
SUPABASE_PUBLISHABLE_KEY = supabase_key_match.group(1)
SUPABASE_PROJECT_REF = SUPABASE_URL.replace("https://", "").split(".")[0]

built_js = ""
asset_names = []
assets_dir = os.path.join(DIST, "assets")
for filename in os.listdir(assets_dir):
    asset_names.append(filename)
    if filename.endswith(".js"):
        with open(os.path.join(assets_dir, filename), encoding="utf-8", errors="ignore") as f:
            built_js += f.read()

if SUPABASE_URL not in built_js or SUPABASE_PUBLISHABLE_KEY not in built_js:
    raise SystemExit("Le build ne contient pas la configuration Supabase de production attendue")
if any("firebase" in name.lower() for name in asset_names) or "firestore.googleapis.com" in built_js:
    raise SystemExit("Le build contient encore une trace Firebase : empaquetage refusé")
if not any(name.startswith("vendor-supabase") for name in asset_names):
    raise SystemExit("Le chunk Supabase est absent du build")

with open(os.path.join(DIST, "server.cjs"), encoding="utf-8", errors="ignore") as f:
    server_bundle = f.read()
if 'require("vite")' in server_bundle or "require('vite')" in server_bundle:
    raise SystemExit("Le serveur de production dépend encore de Vite au chargement : package Node invalide")

# 1. Output directory for cPanel packages
CPANEL_OUT = os.path.join(ROOT, "cpanel-lws-export")
if os.path.exists(CPANEL_OUT):
    shutil.rmtree(CPANEL_OUT)
os.makedirs(CPANEL_OUT, exist_ok=True)

# ------------------------------------------------------------------------------
# GUIDE DE DÉPLOIEMENT
# ------------------------------------------------------------------------------
GUIDE_CONTENT = f"""# Guide Officiel de Déploiement sur cPanel LWS — Excellence Services SARL

Package généré le {BUILD_DATE} avec **Supabase déjà configuré**.

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

- Projet Supabase déjà relié au site : `{SUPABASE_PROJECT_REF}`.
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
    f.write(f"""EXCELLENCE SERVICES SARL — PACKAGE cPanel LWS STATIQUE
Généré le {BUILD_DATE}

1. Extrayez tout le contenu directement dans /public_html (sans dossier intermédiaire).
2. Vérifiez que /public_html/index.html, /public_html/assets/ et /public_html/.htaccess existent.
3. Activez le certificat HTTPS dans cPanel.
4. Ouvrez votre domaine, puis testez /admin avec le mot de passe administrateur actuel.

SUPABASE EST DÉJÀ CONFIGURÉ :
- Projet : {SUPABASE_PROJECT_REF}
- Aucune base MySQL à créer, aucun SQL à importer, aucune variable Supabase à saisir sur LWS.
- Les contenus et formulaires utilisent la base Supabase Cloud existante.

APRÈS INSTALLATION :
- Supprimez le ZIP de public_html.
- Supprimez test-lws.php après diagnostic.
- L'IA fonctionne en mode local vérifié sur cet hébergement statique.

Guide complet : GUIDE_HEBERGEMENT_CPANEL_LWS.md fourni avec les archives.
""")

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

# Copy dist entirely into nodejs-app/dist.
# `downloads` éviterait d'imbriquer les archives dans elles-mêmes ;
# `test-lws.php` ne sert qu'au diagnostic Apache du package statique.
def ignore_node_package_extras(dirpath, contents):
    ignored = []
    if os.path.abspath(dirpath) == os.path.abspath(DIST):
        ignored.extend(name for name in ("downloads", "test-lws.php") if name in contents)
    return ignored

shutil.copytree(DIST, os.path.join(NODEJS_DIR, "dist"), ignore=ignore_node_package_extras)

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

# Create production package.json with the exact locked runtime versions.
with open(os.path.join(ROOT, "package.json"), encoding="utf-8") as f:
    root_package = json.load(f)
with open(os.path.join(ROOT, "package-lock.json"), encoding="utf-8") as f:
    package_lock = json.load(f)

def production_dependency_version(name):
    locked = package_lock.get("packages", {}).get(f"node_modules/{name}", {}).get("version")
    if locked:
        return locked
    declared = root_package.get("dependencies", {}).get(name)
    if not declared:
        raise SystemExit(f"Dépendance de production introuvable pour le package Node : {name}")
    return declared.lstrip("^~")

production_package = {
    "name": "excellence-services-cpanel",
    "version": "1.0.0",
    "description": "Excellence Services SARL - Serveur Node.js de production pour cPanel LWS",
    "main": "app.js",
    "scripts": {
        "start": "node app.js",
    },
    "dependencies": {
        name: production_dependency_version(name)
        for name in ("@google/genai", "compression", "express", "sharp")
    },
    "engines": {
        "node": ">=18.0.0",
    },
}
with open(os.path.join(NODEJS_DIR, "package.json"), "w", encoding="utf-8") as f:
    json.dump(production_package, f, indent=2)
    f.write("\n")

# Create .env.example
with open(os.path.join(NODEJS_DIR, ".env.example"), "w", encoding="utf-8") as f:
    f.write("""# Excellence Services SARL — variables du serveur Node.js cPanel (optionnel)
# À saisir dans Setup Node.js App > Environment variables, pas dans un fichier public.

# Clé Google Gemini optionnelle pour /api/ai/chat.
# Sans cette clé, l'assistant répond avec la connaissance vérifiée du site.
GEMINI_API_KEY=
GEMINI_MODEL=

# app.js force déjà NODE_ENV=production et utilise le port fourni par Passenger.
NODE_ENV=production

# Supabase est déjà configuré dans le front de production :
# aucune variable VITE_SUPABASE_* n'est nécessaire sur LWS.
""")

# Create Node package README
with open(os.path.join(NODEJS_DIR, "README_NODE_CPANEL.md"), "w", encoding="utf-8") as f:
    f.write(f"""# Excellence Services SARL — Package Node.js cPanel LWS

Généré le {BUILD_DATE}. **Supabase est déjà configuré** (projet `{SUPABASE_PROJECT_REF}`) : ne créez pas de base MySQL, n'importez aucun SQL et ne saisissez aucune variable Supabase sur LWS.

## Installation rapide

1. Extrayez ce ZIP dans un dossier d'application hors de `public_html`, par exemple `excellence-services-app`.
2. Dans cPanel, ouvrez **Setup Node.js App > Create Application**.
3. Choisissez Node.js 20 (minimum 18), mode **Production**, racine = le dossier contenant `app.js`, fichier de démarrage = `app.js`.
4. Cliquez sur **Run NPM Install**, puis **Restart**.
5. Variables optionnelles uniquement : `GEMINI_API_KEY` et `GEMINI_MODEL` pour l'IA serveur. `NODE_ENV=production` est déjà géré par `app.js`.
6. Testez `/api/health`, la page d'accueil, `/admin`, un formulaire et l'assistant IA.

Le mot de passe administrateur actuel reste géré par Supabase et n'est pas contenu dans ce package.
Pour un hébergement mutualisé simple, préférez le ZIP `public_html` fourni avec le guide complet.
""")

# Include the full guide at the root of the Node package as well.
with open(os.path.join(NODEJS_DIR, "GUIDE_HEBERGEMENT_CPANEL_LWS.md"), "w", encoding="utf-8") as f:
    f.write(GUIDE_CONTENT)

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
