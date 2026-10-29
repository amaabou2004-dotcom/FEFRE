# Guide de déploiement sur Netlify — Excellence Services SARL

Ce projet est 100% prêt à être déployé sur **Netlify**.

---

## 1. Méthode recommandée : Déploiement automatique via Git (GitHub / GitLab / Bitbucket)

1. Connectez-vous sur [Netlify](https://app.netlify.com/).
2. Cliquez sur **"Add new site"** > **"Import an existing project"**.
3. Choisissez votre fournisseur Git (ex. **GitHub**) et sélectionnez le dépôt de ce projet.
4. Netlify détecte automatiquement la configuration grâce au fichier `netlify.toml` inclus :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
   - **Functions directory** : `netlify/functions`
5. **Supabase : aucune variable Netlify à ajouter.** L'URL du projet officiel
   et sa clé « publishable » publique sont intégrées dans le code
   (`src/lib/supabase.ts`), donc l'espace `/admin` se connecte automatiquement.
   Ajoutez seulement, si vous utilisez l'assistant IA :
   - `GEMINI_API_KEY` : votre clé d'API Google Gemini (fournie par Google AI Studio).

   > Les variables `VITE_SUPABASE_*` restent possibles comme surcharge pour un
   > autre projet Supabase, mais elles sont **optionnelles**. Voir
   > **SUPABASE_SETUP.md** pour Supabase (SQL, compte admin, sécurité).
6. Cliquez sur **"Deploy site"**. Votre site sera en ligne en moins d'une minute avec SSL HTTPS gratuit et nom de domaine personnalisé possible.

---

## 2. Méthode manuelle : Netlify CLI ou Drag & Drop

Si vous souhaitez publier directement depuis votre ordinateur :

### Via Netlify CLI :
```bash
# 1. Installer la CLI Netlify
npm install -g netlify-cli

# 2. Compiler le projet
npm run build

# 3. Déployer en production
netlify deploy --prod --dir=dist --functions=netlify/functions
```

---

## 4. Dépannage si le site ne charge pas sur Netlify (Écran blanc ou erreur)

Si vous constatez un écran blanc ou si le site ne s'affiche pas sur votre URL Netlify, voici les causes les plus fréquentes et leurs solutions :

### 1. Vérifier le "Publish directory" dans les paramètres Netlify
- Rendez-vous sur votre dashboard Netlify > **Site configuration** > **Build & deploy** > **Continuous Deployment** > **Build settings**.
- Vérifiez impérativement que :
  - **Base directory** : vide (laisser vide)
  - **Build command** : `npm run build`
  - **Publish directory** : `dist` (et **NON PAS** `build`, `public` ou `.`)
  - **Functions directory** : `netlify/functions`

### 2. Vérifier la version de Node.js sur Netlify
- Le projet utilise Node.js moderne (Node 20+).
- Le fichier `netlify.toml` définit automatiquement `NODE_VERSION = "20"`.
- Si nécessaire, vous pouvez aussi ajouter dans Netlify > **Environment variables** :
  - Clé : `NODE_VERSION`, Valeur : `20`

### 3. Vérifier les journaux de build ("Deploy log")
- Allez dans l'onglet **Deploys** de votre site Netlify et cliquez sur le dernier déploiement.
- Si le statut est **Failed**, lisez le message d'erreur à la fin du log :
  - Si Netlify indique `npm run build failed`, relancez avec **"Clear cache and deploy site"**.
  - Si le statut est **Published** mais que la page reste blanche, ouvrez la console de votre navigateur (**F12** > onglet **Console**) pour voir l'éventuelle erreur JavaScript.

### 4. Erreur 404 lors du rechargement d'une sous-page
- Les fichiers `netlify.toml` et `public/_redirects` (copié dans `dist/_redirects`) redirigent automatiquement toute requête vers `/index.html 200`. Assurez-vous que le fichier `_redirects` est bien présent à la racine de votre dossier `dist`.
