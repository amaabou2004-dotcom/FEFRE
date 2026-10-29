# Guide de connexion Supabase — Excellence Services SARL

Votre site est maintenant **branché sur Supabase** (à la place de Firebase) :
tout se gère depuis votre espace **`/admin`** — services, secteurs, témoignages,
FAQ, partenaires, réalisations, articles, pages, médias, paramètres du site,
**et les demandes de devis + messages reçus**. Chaque modification enregistrée
dans l'admin est stockée dans Supabase et visible sur le site **en temps réel**.

Le projet Supabase officiel est déjà intégré au code et configuré. Les étapes
ci-dessous servent de référence pour une réinstallation, un remplacement de
projet ou une rotation de clé ; pour le site actuel, seul le redéploiement de
la dernière version du code est nécessaire (étape 5).

---

## Étape 1 — Récupérer l'URL et la clé publique du projet (référence)

1. Ouvrez [app.supabase.com](https://app.supabase.com) → votre projet.
2. **Project Settings** (⚙️ en bas à gauche) → **API**.
3. Notez :
   - **Project URL** → ex. `https://abcdefgh.supabase.co`
   - **anon / public key** (ou « Publishable key ») → longue clé `eyJ…` / `sb_publishable_…`

> ⚠️ N'utilisez **jamais** la clé `service_role` sur le site : elle contourne
> toutes les protections. La clé publique est faite pour être visible, car la
> sécurité est assurée par les règles RLS créées à l'étape 2.

## Étape 2 — Créer les tables (script SQL fourni)

1. Dans Supabase : **SQL Editor** → **New query**.
2. Ouvrez le fichier du projet :
   `supabase/migrations/20261029120000_initial_schema.sql`
3. **Avant de lancer** : tout en bas du script (section 5), remplacez
   `admin@excellence-services-sarl.com` par **l'email que vous utiliserez
   pour vous connecter à l'admin** (étape 3). Si c'est déjà le bon, ne touchez à rien.
4. Collez tout le script → **Run**.

Le script crée : 16 tables (`site_settings`, `services`, `sectors`,
`testimonials`, `faqs`, `pages`, `media`, `articles`, `partners`, `projects`,
`partner_projects`, `partner_documents`, `quotes`, `contact_messages`,
`activity_logs`, `admin_users`), la sécurité **RLS**, le **temps réel** et le
bucket d'images **`site-media`**. Il peut être relancé sans risque.

**Règles de sécurité appliquées :**

| Données | Visiteurs | Administrateurs connectés |
|---|---|---|
| Contenus du site (services, FAQ…) | Lecture | Lecture + modification |
| Devis & messages | Envoi uniquement (invisibles pour eux) | Tout gérer |
| Journal d'activité, images (écriture) | — | Admins uniquement |

## Étape 3 — Définir le mot de passe administrateur (connexion SANS email)

Sur la page `/admin`, on ne saisit **que le mot de passe** — aucun email n'est
demandé. Pour cela, on crée une seule fois, dans Supabase, le compte
administrateur "technique" auquel ce mot de passe sera rattaché :

1. Supabase → **Authentication** → **Users** → **Add user → Create new user**.
2. **Email** (technique, jamais à taper sur le site) :
   `admin@excellence-services-sarl.com`
   **Password** : le mot de passe que vous avez choisi — c'est **celui-là** que
   vous taperez sur `/admin`.
3. Cochez **Auto Confirm User** → **Create user**.

Le mot de passe est stocké **chiffré par Supabase** : il n'apparaît ni dans le
code, ni dans GitHub. Pour le changer plus tard : Authentication → Users →
« … » → *Send password recovery* / recréer l'utilisateur.

> Si vous créez le compte avec un **autre email**, ajoutez la variable
> `VITE_ADMIN_EMAIL=cet-email` à l'étape 5 et mettez le même email dans la
> table `admin_users` (section 5 du script SQL).

## Étape 4 — Fermer les inscriptions publiques (important)

Pour qu'un visiteur ne puisse pas créer de compte :

**Authentication → Providers → Email** → décochez **« Allow new users to sign up »** → Save.

Même sans cela, un compte non listé dans `admin_users` ne peut rien modifier ;
mais cette étape évite tout compte parasite.

## Étape 5 — Redéployer (aucune clé à configurer chez l'hébergeur)

L'URL du projet Supabase officiel et sa clé **publishable publique** sont
intégrées comme valeurs par défaut dans `src/lib/supabase.ts`. Il n'y a donc
**aucune variable Supabase à ajouter dans Netlify, LWS ou en local** : déployez
simplement la dernière version du code.

Les variables `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` (ou
`VITE_SUPABASE_ANON_KEY`) restent possibles comme **surcharge optionnelle**
pour pointer temporairement vers un autre projet pendant le développement.
Dans ce cas, fournissez l'URL et la clé ensemble, puis relancez un build,
car les variables `VITE_…` sont intégrées au site au moment du build.

### Sur Netlify
Aucun réglage Supabase requis : fusionnez la dernière version du code (ou
**Deploys → Trigger deploy → Deploy site**).

### En local
Lancez simplement `npm run dev`. Le fichier `.env.local` n'est nécessaire
que pour surcharger le projet Supabase (voir `.env.example`).

### Sur cPanel / LWS
Relancez `npm run build:cpanel` depuis la dernière version du code, puis
téléversez le nouveau package : il contient déjà la configuration publique.

## Étape 6 — Première connexion

1. Ouvrez `https://votre-site/admin`.
2. Saisissez **uniquement votre mot de passe** (celui de l'étape 3) → « Accéder à l'espace admin ».
3. Le bandeau du tableau de bord indique **« Supabase connecté »** et les
   contenus actuels du site sont **importés automatiquement** dans les tables
   (bouton « Importer les contenus par défaut » si besoin).
4. Vérifiez dans Supabase → **Table Editor** : les services, FAQ, etc. sont là.
5. Testez : modifiez un texte dans l'admin → le site public se met à jour sans
   rechargement. Envoyez un devis test depuis `/devis` → il apparaît dans
   l'onglet **Devis & Messages**.

---

## Plusieurs personnes doivent administrer le site ?

La connexion « mot de passe uniquement » correspond à **un seul compte
administrateur partagé** : donnez le mot de passe uniquement aux personnes de
confiance. Pour retirer l'accès à quelqu'un, changez le mot de passe du compte
(Authentication → Users) — toutes les anciennes sessions devront se reconnecter.

> Si un jour il faut des comptes **personnels** (un mot de passe différent par
> personne, journal nominatif), il faudra ré-afficher le champ email sur
> l'écran de connexion et ajouter chaque adresse dans `admin_users` :
> ```sql
> insert into public.admin_users (email) values ('nouvel.admin@exemple.com');
> ```

## Images téléversées depuis l'admin

Les images envoyées via les formulaires admin (médiathèque, réalisations,
articles) partent dans **Storage → bucket `site-media`** (public en lecture,
écriture réservée aux admins). Les images historiques livrées avec le code
restent servies par le site ; la médiathèque permet de les remplacer par
emplacement (ex. `hero-main`).

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Bandeau « Connexion à Supabase indisponible » sur /admin | Ancien déploiement, panne réseau ou clé publique révoquée | Redéployer la dernière version du code ; vérifier l'état du projet Supabase |
| « Tables introuvables » | Script SQL non exécuté | Étape 2 |
| Connexion OK mais « compte non autorisé » | Email absent de `admin_users` | Section 5 du SQL / requête ci-dessus |
| « Mot de passe incorrect » | Le mot de passe tapé ≠ celui du compte de l'étape 3 (ou compte non créé / email technique différent sans `VITE_ADMIN_EMAIL`) | Étape 3 ; vérifiez « Auto Confirm » et, si besoin, `VITE_ADMIN_EMAIL` |
| « Permission refusée (RLS) » à l'enregistrement | Compte absent de `admin_users`, ou session expirée | Section 5 du SQL, puis reconnectez-vous |
| Le devis test n'arrive pas | Ancien déploiement ou projet Supabase injoignable | Redéployer la dernière version du code et vérifier Supabase |

## Ce qui a changé dans le code

- `src/lib/supabase.ts` : client Supabase avec configuration publique officielle
  intégrée (surcharge `VITE_…` optionnelle) + messages d'erreur en français.
- `src/lib/supabase-mappers.ts` : traduction colonnes SQL ⇄ objets du site.
- `src/lib/DataContext.tsx` : données du site via Supabase (même interface
  qu'avant — aucune page publique modifiée, sauf les Actualités branchées).
- `src/lib/AuthContext.tsx` : connexion admin **par mot de passe uniquement**
  (session Supabase Auth sur le compte technique invisible `ADMIN_LOGIN_EMAIL`)
  avec contrôle `admin_users`.
- `src/components/admin/EntityManager.tsx` + `AdminPage` : CRUD complet
  (les onglets Secteurs, Témoignages, FAQ, Médias étaient vides avant).
- Firebase a été **entièrement retiré** (code, dépendance, anciens mots de
  passe codés en dur).
