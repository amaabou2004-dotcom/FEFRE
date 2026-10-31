-- =====================================================================
-- Notifications email automatiques (devis + messages de contact)
-- ---------------------------------------------------------------------
-- À chaque INSERT dans public.quotes / public.contact_messages, un
-- trigger appelle (via pg_net) l'Edge Function « notify-leads » qui
-- envoie l'email de notification via Resend.
--
-- Prérequis (une seule fois, valeurs à ne JAMAIS committer) :
--   select vault.create_secret(
--     'https://<PROJECT_REF>.supabase.co/functions/v1/notify-leads',
--     'notify_leads_url', 'URL Edge Function notifications');
--   select vault.create_secret('<SECRET_ALEATOIRE>',
--     'notify_leads_secret', 'Secret partagé trigger -> Edge Function');
--
-- Et côté Edge Function (Secrets) : RESEND_API_KEY, NOTIFY_TO_EMAIL,
-- NOTIFY_FROM_EMAIL, NOTIFY_WEBHOOK_SECRET (= même valeur que Vault).
-- =====================================================================

create extension if not exists pg_net;

create or replace function public.notify_new_lead()
returns trigger
language plpgsql
security definer
set search_path = public, net, vault
as $$
declare
  v_url    text;
  v_secret text;
begin
  select decrypted_secret into v_url
    from vault.decrypted_secrets where name = 'notify_leads_url' limit 1;
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'notify_leads_secret' limit 1;

  -- Notification non configurée : ne jamais bloquer l'enregistrement.
  if v_url is null then
    return new;
  end if;

  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-webhook-secret', coalesce(v_secret, '')),
    body    := jsonb_build_object('table', TG_TABLE_NAME, 'record', to_jsonb(NEW))
  );
  return new;
exception when others then
  -- Un échec de notification ne doit jamais empêcher l'insertion du lead.
  return new;
end;
$$;

drop trigger if exists trg_notify_new_quote on public.quotes;
create trigger trg_notify_new_quote
  after insert on public.quotes
  for each row execute function public.notify_new_lead();

drop trigger if exists trg_notify_new_contact_message on public.contact_messages;
create trigger trg_notify_new_contact_message
  after insert on public.contact_messages
  for each row execute function public.notify_new_lead();
