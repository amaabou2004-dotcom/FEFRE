-- ============================================================================
-- EXCELLENCE SERVICES SARL — Schéma Supabase (PostgreSQL)
-- ----------------------------------------------------------------------------
-- À exécuter dans : Supabase Dashboard → SQL Editor → New query → coller → Run.
-- Le script est RÉEXÉCUTABLE (idempotent) : vous pouvez le relancer sans risque.
--
-- Contenu :
--   1. Tables du site (contenus gérables depuis l'espace admin)
--   2. Table admin_users (liste blanche des administrateurs)
--   3. Sécurité RLS : lecture publique des contenus, écriture admin uniquement,
--      formulaires (devis/contact) ouverts en envoi mais invisibles au public
--   4. Temps réel (les modifications admin apparaissent sans recharger le site)
--   5. Bucket Storage public « site-media » pour les images téléversées
--   6. ⚠️ À LA FIN : remplacez l'email administrateur par le vôtre.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 0. Fonctions utilitaires
-- ----------------------------------------------------------------------------

-- Met à jour automatiquement updated_at à chaque modification.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Liste blanche des administrateurs (remplie à la section 6).
create table if not exists public.admin_users (
  email      text primary key,
  user_id    uuid,
  created_at timestamptz not null default now()
);

-- L'utilisateur connecté (Supabase Auth) est-il un administrateur reconnu ?
-- SECURITY DEFINER = la fonction lit admin_users sans être bloquée par la RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
       or a.user_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- 1. Tables de contenus (gérables depuis l'espace admin)
-- ----------------------------------------------------------------------------

create table if not exists public.site_settings (
  id                        text primary key default 'general',
  name                      text,
  short_name                text,
  location                  text,
  country                   text,
  email                     text,
  whatsapp                  text,
  whatsapp_raw              text,
  phones                    jsonb not null default '[]'::jsonb,
  working_hours             text,
  nif                       text,
  rccm                      text,
  default_whatsapp_message  text,
  tagline                   text,
  hero_subtitle             text,
  mission                   text,
  about_text                text,
  company_values            text[] not null default '{}',
  shop_status               text not null default 'in_preparation',
  shop_notice               text,
  seo_default_title         text,
  seo_default_description   text,
  facebook                  text,
  tiktok                    text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create table if not exists public.services (
  id            text primary key,
  number        text,
  title         text,
  slug          text unique,
  positioning   text,
  summary       text,
  icon_name     text,
  prestations   text[] not null default '{}',
  status        text not null default 'active',
  display_order integer,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.sectors (
  id            text primary key,
  name          text,
  slug          text unique,
  icon_name     text,
  description   text,
  features      text[] not null default '{}',
  status        text not null default 'active',
  display_order integer,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.testimonials (
  id            text primary key,
  quote         text,
  author        text,
  author_role   text,
  company       text,
  rating        integer,
  avatar_url    text,
  status        text not null default 'published',
  display_order integer,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.faqs (
  id            text primary key,
  question      text,
  answer        text,
  category      text,
  display_order integer not null default 0,
  status        text not null default 'published',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.pages (
  id              text primary key,
  slug            text unique,
  name            text,
  title           text,
  subtitle        text,
  content         text,
  cta_text        text,
  cta_link        text,
  seo_title       text,
  seo_description text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.media (
  id           text primary key,
  name         text,
  description  text,
  location     text,
  url          text,
  mobile_url   text,
  src_set      text,
  alt          text,
  category     text,
  aspect_ratio text,
  priority     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.articles (
  id              text primary key,
  title           text,
  slug            text unique,
  category        text,
  summary         text,
  content         text,
  date            text,
  read_time       text,
  image_url       text,
  image_mobile_url text,
  src_set         text,
  author          text,
  author_role     text,
  tags            text[] not null default '{}',
  status          text not null default 'published',
  display_order   integer,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.partners (
  id               text primary key,
  name             text,
  category         text,
  logo_url         text,
  description      text,
  website          text,
  partnership_type text,
  status           text not null default 'active',
  display_order    integer,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.projects (
  id            text primary key,
  title         text,
  slug          text,
  category      text,
  client        text,
  summary       text,
  deliverables  text[] not null default '{}',
  results       text[] not null default '{}',
  image_url     text,
  date          text,
  status        text not null default 'standard',
  display_order integer,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.partner_projects (
  id               text primary key,
  title            text,
  partner_id       text,
  partner_name     text,
  status           text not null default 'pending',
  start_date       text,
  progress         integer not null default 0,
  description      text,
  key_deliverables text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.partner_documents (
  id          text primary key,
  title       text,
  partner_id  text,
  type        text,
  file_size   text,
  upload_date text,
  url         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Demandes de devis envoyées par les visiteurs (privé : visible admin seul).
create table if not exists public.quotes (
  id               text primary key default gen_random_uuid()::text,
  full_name        text,
  first_name       text,
  last_name        text,
  company          text,
  email            text,
  phone            text,
  whatsapp         text,
  service_interest text,
  sector           text,
  budget_range     text,
  timeline         text,
  details          text,
  file_name        text,
  status           text not null default 'new',
  admin_notes      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Messages du formulaire de contact (privé : visible admin seul).
create table if not exists public.contact_messages (
  id         text primary key default gen_random_uuid()::text,
  full_name  text,
  company    text,
  email      text,
  phone      text,
  subject    text,
  message    text,
  status     text not null default 'unread',
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Journal des actions réalisées dans l'espace admin (privé).
create table if not exists public.activity_logs (
  id          text primary key default gen_random_uuid()::text,
  action      text,
  actor       text,
  details     text,
  type        text not null default 'update',
  entity_type text,
  entity_id   text,
  created_at  timestamptz not null default now()
);

-- Index pour les affichages admin (tri récent → ancien).
create index if not exists idx_quotes_created_at on public.quotes (created_at desc);
create index if not exists idx_contact_created_at on public.contact_messages (created_at desc);
create index if not exists idx_activity_created_at on public.activity_logs (created_at desc);
create index if not exists idx_services_order on public.services (display_order);
create index if not exists idx_faqs_order on public.faqs (display_order);

-- Déclencheurs updated_at (drop + create = réexécutable).
do $$
declare t text;
begin
  foreach t in array array[
    'site_settings','services','sectors','testimonials','faqs','pages','media',
    'articles','partners','projects','partner_projects','partner_documents',
    'quotes','contact_messages'
  ]
  loop
    execute format('drop trigger if exists trg_%s_updated_at on public.%I', t, t);
    execute format(
      'create trigger trg_%s_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 2. Sécurité RLS (Row Level Security)
-- ----------------------------------------------------------------------------
-- Règles :
--  • Contenus publics .......... tout le monde peut LIRE, seuls les admins écrivent.
--  • Devis / messages .......... tout le monde peut ENVOYER (insert),
--                                seuls les admins peuvent lire/modifier/supprimer.
--  • Journal d'activité ........ admins uniquement.
--  • admin_users ............... un utilisateur connecté peut voir SA propre
--                                ligne (pour vérifier ses droits) ; aucune
--                                écriture via l'API (SQL Editor uniquement).

do $$
declare t text;
begin
  foreach t in array array[
    'site_settings','services','sectors','testimonials','faqs','pages','media',
    'articles','partners','projects','partner_projects','partner_documents'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_public_read" on public.%I', t, t);
    execute format('create policy "%s_public_read" on public.%I for select using (true)', t, t);
    execute format('drop policy if exists "%s_admin_write" on public.%I', t, t);
    execute format(
      'create policy "%s_admin_write" on public.%I for all
       using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;

alter table public.quotes enable row level security;
drop policy if exists "quotes_public_insert" on public.quotes;
create policy "quotes_public_insert" on public.quotes
  for insert with check (coalesce(email, '') like '%@%');
drop policy if exists "quotes_admin_all" on public.quotes;
create policy "quotes_admin_all" on public.quotes
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.contact_messages enable row level security;
drop policy if exists "contact_public_insert" on public.contact_messages;
create policy "contact_public_insert" on public.contact_messages
  for insert with check (coalesce(email, '') like '%@%');
drop policy if exists "contact_admin_all" on public.contact_messages;
create policy "contact_admin_all" on public.contact_messages
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.activity_logs enable row level security;
drop policy if exists "activity_admin_all" on public.activity_logs;
create policy "activity_admin_all" on public.activity_logs
  for all using (public.is_admin()) with check (public.is_admin());

alter table public.admin_users enable row level security;
drop policy if exists "admin_users_read_own" on public.admin_users;
create policy "admin_users_read_own" on public.admin_users
  for select to authenticated
  using (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    or user_id = auth.uid()
  );

-- Droits d'accès API (la RLS ci-dessus reste le vrai garde-fou).
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Temps réel : les modifications admin se reflètent sans recharger la page.
-- ----------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'site_settings','services','sectors','testimonials','faqs','pages','media',
    'articles','partners','projects','partner_projects','partner_documents',
    'quotes','contact_messages','activity_logs'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- 4. Stockage d'images : bucket public « site-media »
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

drop policy if exists "site_media_public_read" on storage.objects;
create policy "site_media_public_read" on storage.objects
  for select using (bucket_id = 'site-media');

drop policy if exists "site_media_admin_insert" on storage.objects;
create policy "site_media_admin_insert" on storage.objects
  for insert with check (bucket_id = 'site-media' and public.is_admin());

drop policy if exists "site_media_admin_update" on storage.objects;
create policy "site_media_admin_update" on storage.objects
  for update using (bucket_id = 'site-media' and public.is_admin())
  with check (bucket_id = 'site-media' and public.is_admin());

drop policy if exists "site_media_admin_delete" on storage.objects;
create policy "site_media_admin_delete" on storage.objects
  for delete using (bucket_id = 'site-media' and public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. ⚠️ ADMINISTRATEUR — REMPLACEZ L'EMAIL CI-DESSOUS PAR LE VÔTRE
-- ----------------------------------------------------------------------------
-- Cet email doit être EXACTEMENT celui du compte créé dans :
--   Supabase Dashboard → Authentication → Users → Add user.
-- Sans cette ligne, la connexion réussira mais l'espace admin restera bloqué
-- ("compte non autorisé") et aucune modification ne sera enregistrée.

insert into public.admin_users (email)
values ('admin@excellence-services-sarl.com')  -- ←←← MODIFIEZ ICI si besoin
on conflict (email) do nothing;

-- ============================================================================
-- Terminé. Étapes suivantes (voir SUPABASE_SETUP.md) :
--  1. Authentication → Add user (email ci-dessus + mot de passe, "Auto Confirm")
--  2. Désactiver les inscriptions publiques (Authentication → Providers/Email)
--  3. Renseigner VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY puis redéployer
--  4. Se connecter sur /admin → les contenus par défaut sont importés
--     automatiquement dans Supabase lors de la première connexion admin.
-- ============================================================================
