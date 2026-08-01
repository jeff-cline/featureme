import "server-only";
import { prisma } from "./db";

// Central registry of platform-level integrations the God account manages.
// Each has a key, a human label, and a set of fields the owner fills in later.
export type IntegrationField = {
  name: string;
  label: string;
  type?: "text" | "password";
  placeholder?: string;
};

export type IntegrationDef = {
  key: string;
  label: string;
  blurb: string;
  fields: IntegrationField[];
  testable?: boolean;
  externalUrl?: string; // where the owner generates the key
};

export const INTEGRATIONS: IntegrationDef[] = [
  {
    key: "zapmail",
    label: "ZapMail — outbound email",
    blurb: "API-provisioned mailboxes for sending member invites & notifications. Rotates for deliverability.",
    fields: [{ name: "apiKey", label: "ZapMail API key", type: "password", placeholder: "x-auth-zapmail value" }],
    testable: true,
    externalUrl: "https://app.zapmail.ai",
  },
  {
    key: "smtp",
    label: "Generic SMTP (fallback)",
    blurb: "Any SMTP provider (e.g. a single mailbox). Used if ZapMail isn't configured.",
    fields: [
      { name: "smtpHost", label: "SMTP host", placeholder: "smtp.example.com" },
      { name: "smtpPort", label: "SMTP port", placeholder: "587" },
      { name: "smtpUser", label: "SMTP user" },
      { name: "smtpPass", label: "SMTP password", type: "password" },
      { name: "fromEmail", label: "From email", placeholder: "jeff@featureme.io" },
    ],
    testable: true,
  },
  {
    key: "stripe",
    label: "Stripe — billing & coupons",
    blurb: "Charges the $99 / $299 / $999 plans. Add the secret key + webhook secret + price IDs.",
    fields: [
      { name: "secretKey", label: "Secret key", type: "password", placeholder: "sk_live_…" },
      { name: "publishableKey", label: "Publishable key", placeholder: "pk_live_…" },
      { name: "webhookSecret", label: "Webhook signing secret", type: "password", placeholder: "whsec_…" },
      { name: "priceBasic", label: "Price ID — Basic ($99)", placeholder: "price_…" },
      { name: "priceMid", label: "Price ID — Mid ($299)", placeholder: "price_…" },
      { name: "priceAdvanced", label: "Price ID — Advanced ($999)", placeholder: "price_…" },
    ],
    testable: true,
    externalUrl: "https://dashboard.stripe.com/apikeys",
  },
  {
    key: "medium",
    label: "Medium — syndication (OAuth app)",
    blurb: "OAuth client so members can connect Medium and republish with canonical URLs.",
    fields: [
      { name: "clientId", label: "Client ID" },
      { name: "clientSecret", label: "Client secret", type: "password" },
    ],
    externalUrl: "https://medium.com/me/applications",
  },
  {
    key: "blogger",
    label: "Blogger — syndication (Google OAuth)",
    blurb: "Google Cloud OAuth client for Blogger republishing.",
    fields: [
      { name: "clientId", label: "Google client ID" },
      { name: "clientSecret", label: "Google client secret", type: "password" },
    ],
    externalUrl: "https://console.cloud.google.com/apis/credentials",
  },
  {
    key: "linkedin",
    label: "LinkedIn — org posts (OAuth app)",
    blurb: "LinkedIn app for posting to organization pages (requires product review).",
    fields: [
      { name: "clientId", label: "Client ID" },
      { name: "clientSecret", label: "Client secret", type: "password" },
    ],
    externalUrl: "https://www.linkedin.com/developers/apps",
  },
  {
    key: "tumblr",
    label: "Tumblr — syndication (OAuth app)",
    blurb: "Tumblr OAuth consumer for republishing.",
    fields: [
      { name: "consumerKey", label: "Consumer key" },
      { name: "consumerSecret", label: "Consumer secret", type: "password" },
    ],
    externalUrl: "https://www.tumblr.com/oauth/apps",
  },
];

export function integrationDef(key: string) {
  return INTEGRATIONS.find((i) => i.key === key);
}

// Read a saved integration's config JSON (or {}).
export async function getIntegrationConfig(key: string): Promise<Record<string, string>> {
  const row = await prisma.integration.findUnique({ where: { key } });
  if (!row) return {};
  try {
    return JSON.parse(row.config || "{}");
  } catch {
    return {};
  }
}

// Merge-save an integration's config.
export async function saveIntegrationConfig(key: string, patch: Record<string, string>) {
  const def = integrationDef(key);
  const cur = await getIntegrationConfig(key);
  const next = { ...cur, ...patch };
  const hasValues = Object.values(next).some((v) => String(v || "").trim());
  await prisma.integration.upsert({
    where: { key },
    update: { config: JSON.stringify(next), connected: hasValues, status: hasValues ? "saved" : "unconfigured" },
    create: {
      key,
      label: def?.label ?? key,
      config: JSON.stringify(next),
      connected: hasValues,
      status: hasValues ? "saved" : "unconfigured",
    },
  });
  return next;
}

export async function markIntegrationTest(key: string, ok: boolean, error = "") {
  await prisma.integration.update({
    where: { key },
    data: { status: ok ? "verified" : "failed", lastError: ok ? "" : error, lastTestedAt: new Date() },
  }).catch(() => {});
}
