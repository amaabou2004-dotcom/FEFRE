// Excellence Services SARL — Notifications email automatiques
// ---------------------------------------------------------------
// Déclenchée par un trigger PostgreSQL (pg_net) à chaque INSERT dans
// public.quotes et public.contact_messages. Envoi via l'API Resend.
//
// Secrets Edge Function (Supabase → Edge Functions → Secrets) :
//   RESEND_API_KEY        Clé API Resend (commence par « re_ »)
//   NOTIFY_TO_EMAIL       Destinataire des notifications
//   NOTIFY_FROM_EMAIL     Expéditeur affiché
//   NOTIFY_WEBHOOK_SECRET Secret partagé avec le trigger SQL (en-tête x-webhook-secret)
//
// Payload accepté (POST JSON) :
//   { "table": "quotes" | "contact_messages", "record": { ...ligne insérée... } }

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const NOTIFY_TO =
  Deno.env.get("NOTIFY_TO_EMAIL") || "admin@excellence-services-sarl.com";
const NOTIFY_FROM =
  Deno.env.get("NOTIFY_FROM_EMAIL") ||
  "Excellence Services SARL <onboarding@resend.dev>";
const WEBHOOK_SECRET = Deno.env.get("NOTIFY_WEBHOOK_SECRET") || "";
const ADMIN_URL = "https://nimble-marigold-1cb0d0.netlify.app/admin";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function row(label: string, valueHtml: string): string {
  if (!valueHtml) return "";
  return `<tr>
    <td style="padding:8px 12px;font-size:13px;color:#64748B;font-weight:600;white-space:nowrap;vertical-align:top">${esc(label)}</td>
    <td style="padding:8px 12px;font-size:14px;color:#0E1D38">${valueHtml}</td>
  </tr>`;
}

function layout(title: string, intro: string, rowsHtml: string): string {
  return `<!doctype html>
<html lang="fr"><body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0">
        <tr><td style="background:#01184C;padding:20px 28px">
          <div style="font-size:11px;letter-spacing:2px;color:#D4AF37;font-weight:700">EXCELLENCE SERVICES SARL</div>
          <div style="font-size:20px;color:#FFFFFF;font-weight:700;margin-top:6px">${esc(title)}</div>
        </td></tr>
        <tr><td style="height:4px;background:#D4AF37"></td></tr>
        <tr><td style="padding:20px 28px 4px 28px;font-size:14px;color:#334155;line-height:1.6">${esc(intro)}</td></tr>
        <tr><td style="padding:8px 28px 20px 28px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E2E8F0;border-radius:8px">${rowsHtml}</table>
        </td></tr>
        <tr><td align="center" style="padding:0 28px 24px 28px">
          <a href="${ADMIN_URL}" style="display:inline-block;background:#01184C;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;padding:12px 22px;border-radius:8px">Ouvrir l’espace d’administration</a>
          <div style="font-size:12px;color:#94A3B8;margin-top:14px">Vous pouvez répondre directement à cet email : la réponse ira au visiteur.</div>
        </td></tr>
      </table>
      <div style="font-size:11px;color:#94A3B8;margin-top:14px">Notification automatique du site Excellence Services SARL — Niamey, Niger</div>
    </td></tr>
  </table>
</body></html>`;
}

function buildQuoteEmail(r: Record<string, unknown>) {
  const subject = `🆕 Nouvelle demande de devis — ${clean(r.full_name) || "Prospect"}`;
  const email = clean(r.email);
  const phone = clean(r.phone);
  const rows =
    row("Nom", esc(r.full_name)) +
    row("Entreprise", esc(r.company)) +
    row("Email", email ? `<a href="mailto:${esc(email)}" style="color:#01184C;font-weight:600">${esc(email)}</a>` : "") +
    row("Téléphone", phone ? `<a href="tel:${esc(phone.replace(/\s+/g, ""))}" style="color:#01184C;font-weight:600">${esc(phone)}</a>` : "") +
    row("WhatsApp", esc(r.whatsapp)) +
    row("Service demandé", `<strong>${esc(r.service_interest)}</strong>`) +
    row("Secteur", esc(r.sector)) +
    row("Budget indicatif", esc(r.budget_range)) +
    row("Délai souhaité", esc(r.timeline)) +
    row("Description du besoin", esc(r.details).replace(/\n/g, "<br>")) +
    row("Fichier mentionné", esc(r.file_name)) +
    row("Reçu le", esc(r.created_at));
  const html = layout(
    "Nouvelle demande de devis",
    "Un visiteur vient d’envoyer une demande de devis depuis le site. Voici le détail :",
    rows,
  );
  const text = [
    "NOUVELLE DEMANDE DE DEVIS — Excellence Services SARL",
    "",
    `Nom : ${clean(r.full_name)}`,
    `Entreprise : ${clean(r.company)}`,
    `Email : ${email}`,
    `Téléphone : ${phone}`,
    `WhatsApp : ${clean(r.whatsapp)}`,
    `Service demandé : ${clean(r.service_interest)}`,
    `Secteur : ${clean(r.sector)}`,
    `Budget indicatif : ${clean(r.budget_range)}`,
    `Délai souhaité : ${clean(r.timeline)}`,
    `Description : ${clean(r.details)}`,
    "",
    `Admin : ${ADMIN_URL}`,
  ].join("\n");
  return { subject, html, text, replyTo: email || undefined };
}

function buildContactEmail(r: Record<string, unknown>) {
  const subject = `✉️ Nouveau message de contact — ${clean(r.full_name) || "Visiteur"}`;
  const email = clean(r.email);
  const phone = clean(r.phone);
  const rows =
    row("Nom", esc(r.full_name)) +
    row("Entreprise", esc(r.company)) +
    row("Email", email ? `<a href="mailto:${esc(email)}" style="color:#01184C;font-weight:600">${esc(email)}</a>` : "") +
    row("Téléphone", phone ? `<a href="tel:${esc(phone.replace(/\s+/g, ""))}" style="color:#01184C;font-weight:600">${esc(phone)}</a>` : "") +
    row("Objet", `<strong>${esc(r.subject)}</strong>`) +
    row("Message", esc(r.message).replace(/\n/g, "<br>")) +
    row("Reçu le", esc(r.created_at));
  const html = layout(
    "Nouveau message de contact",
    "Un visiteur vient d’envoyer un message via le formulaire de contact du site :",
    rows,
  );
  const text = [
    "NOUVEAU MESSAGE DE CONTACT — Excellence Services SARL",
    "",
    `Nom : ${clean(r.full_name)}`,
    `Entreprise : ${clean(r.company)}`,
    `Email : ${email}`,
    `Téléphone : ${phone}`,
    `Objet : ${clean(r.subject)}`,
    `Message : ${clean(r.message)}`,
    "",
    `Admin : ${ADMIN_URL}`,
  ].join("\n");
  return { subject, html, text, replyTo: email || undefined };
}

Deno.serve(async (req: Request) => {
  // Petit endpoint de santé (aucune donnée sensible)
  if (req.method === "GET") {
    return json({ ok: true, resendConfigured: Boolean(RESEND_API_KEY) });
  }
  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée" }, 405);
  }

  if (!WEBHOOK_SECRET || req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return json({ error: "Non autorisé" }, 401);
  }

  const payload = await req.json().catch(() => null);
  const table = payload?.table || payload?.kind;
  const record = (payload?.record || {}) as Record<string, unknown>;

  if (table !== "quotes" && table !== "contact_messages") {
    return json({ error: "Table non prise en charge" }, 400);
  }

  if (!RESEND_API_KEY) {
    return json({ error: "RESEND_API_KEY non configurée" }, 503);
  }

  const mail = table === "quotes" ? buildQuoteEmail(record) : buildContactEmail(record);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: NOTIFY_FROM,
      to: [NOTIFY_TO],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      reply_to: mail.replyTo,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("[notify-leads] Resend error", res.status, data);
    return json({ error: "Échec d’envoi Resend", details: data }, 502);
  }

  return json({ ok: true, id: (data as { id?: string }).id || null });
});
