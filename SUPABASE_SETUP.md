# Guide de connexion Supabase — Excellence Services SARL

Votre site est maintenant **branché sur Supabase** (à la place de Firebase) :
tout se gère depuis votre espace **`/admin`** — services, secteurs, témoignages,
FAQ, partenaires, réalisations, articles, pages, médias, paramètres du site,
**et les demandes de devis + messages reçus**. Chaque modification enregistrée
dans l'admin est stockée dans Supabase et visible sur le site **en temps réel**.

Il ne reste que **6 étapes à faire une seule fois** dans votre projet Supabase
(environ 10 minutes). Tant qu'elles ne sont pas terminées, le site public
continue d'afficher les contenus intégrés au code — il ne casse pas.

---

## Étape 1 — Récupérer l'URL et la clé publique du projet

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

## Étape 3 — Créer le compte administrateur

1. Supabase → **Authentication** → **Users** → **Add user → Create new user**.
2. Email = **exactement** celui de l'étape 2 + un mot de passe fort.
3. Cochez **Auto Confirm User** → **Create user**.

C'est ce couple **email + mot de passe** qui servira sur la page `/admin`.
(L'ancien mot de passe partagé Firebase a été supprimé du code.)

## Étape 4 — Fermer les inscriptions publiques (important)

Pour qu'un visiteur ne puisse pas créer de compte :

**Authentication → Providers → Email** → décochez **« Allow new users to sign up »** → Save.

Même sans cela, un compte non listé dans `admin_users` ne peut rien modifier ;
mais cette étape évite tout compte parasite.

## Étape 5 — Donner les clés au site, puis redéployer

Les variables `VITE_…` sont intégrées au site **au moment du build** :
après les avoir renseignées, il faut **redéployer**.

### Sur Netlify (recommandé)
Site configuration → **Environment variables** → ajoutez :

| Clé | Valeur |
|---|---|
| `VITE_SUPABASE_URL` | l'URL de l'étape 1 |
| `VITE_SUPABASE_ANON_KEY` | la clé publique de l'étape 1 |

Puis **Deploys → Trigger deploy → Deploy site**.

### En local (pour tester sur votre ordinateur)
Créez un fichier `.env.local` à la racine du projet (modèle : `.env.example`) :

```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-publique
```

puis `npm run dev`.

### Sur cPanel / LWS
Les archives ZIP sont générées par build : relancez `npm run build:cpanel`
**après** avoir créé `.env.local`, sinon les ZIP ne contiendront pas les clés.

## Étape 6 — Première connexion

1. Ouvrez `https://votre-site/admin`.
2. Connectez-vous avec le compte de l'étape 3.
3. Le bandeau du tableau de bord indique **« Supabase connecté »** et les
   contenus actuels du site sont **importés automatiquement** dans les tables
   (bouton « Importer les contenus par défaut » si besoin).
4. Vérifiez dans Supabase → **Table Editor** : les services, FAQ, etc. sont là.
5. Testez : modifiez un texte dans l'admin → le site public se met à jour sans
   rechargement. Envoyez un devis test depuis `/devis` → il apparaît dans
   l'onglet **Devis & Messages**.

---

## Ajouter un deuxième administrateur

1. Créez son compte (étape 3).
2. SQL Editor :
   ```sql
   insert into public.admin_users (email) values ('nouvel.admin@exemple.com');
   ```
Pour retirer un accès : supprimez sa ligne dans `admin_users` **et** son
utilisateur dans Authentication → Users.

## Images téléversées depuis l'admin

Les images envoyées via les formulaires admin (médiathèque, réalisations,
articles) partent dans **Storage → bucket `site-media`** (public en lecture,
écriture réservée aux admins). Les images historiques livrées avec le code
restent servies par le site ; la médiathèque permet de les remplacer par
emplacement (ex. `hero-main`).

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| Bandeau « Supabase non configuré » sur /admin | Variables absentes ou pas de redéploiement | Étape 5, puis rebuild/redéploy |
| « Tables introuvables » | Script SQL non exécuté | Étape 2 |
| Connexion OK mais « compte non autorisé » | Email absent de `admin_users` | Section 5 du SQL / requête ci-dessus |
| « Identifiants invalides » | Compte Auth inexistant ou mauvais mot de passe | Étape 3 ; vérifiez « Auto Confirm » |
| « Permission refusée (RLS) » à l'enregistrement | Connecté avec un compte non admin, ou session expirée | Reconnectez-vous avec le compte admin |
| Le devis test n'arrive pas | Ancien déploiement sans les clés | Redéployer après l'étape 5 |
| Connexion Google en erreur | Provider Google non activé dans Supabase | Authentication → Providers → Google (optionnel) |

## Ce qui a changé dans le code

- `src/lib/supabase.ts` : client Supabase + messages d'erreur en français.
- `src/lib/supabase-mappers.ts` : traduction colonnes SQL ⇄ objets du site.
- `src/lib/DataContext.tsx` : données du site via Supabase (même interface
  qu'avant — aucune page publique modifiée, sauf les Actualités branchées).
- `src/lib/AuthContext.tsx` : connexion Supabase Auth (email + mot de passe,
  Google optionnel) avec contrôle `admin_users`.
- `src/components/admin/EntityManager.tsx` + `AdminPage` : CRUD complet
  (les onglets Secteurs, Témoignages, FAQ, Médias étaient vides avant).
- Firebase a été **entièrement retiré** (code, dépendance, anciens mots de
  passe codés en dur).
