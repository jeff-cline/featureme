import "server-only";
import { getIntegrationConfig } from "./integrations";

// Client for the CORE platform API (medigap.plus). FeatureMe uses CORE for email
// (ZapMail lives in CORE) and CRM (leads land in CORE's JV pipeline) instead of
// configuring those itself. Auth: x-core-key + x-core-secret (scoped keys issued
// at medigap.plus/core-api).

async function cfg() {
  const c = await getIntegrationConfig("core");
  return {
    baseUrl: (c.baseUrl || "https://medigap.plus").replace(/\/+$/, ""),
    key: c.key || "",
    secret: c.secret || "",
  };
}

export async function coreConfigured(): Promise<boolean> {
  const c = await cfg();
  return Boolean(c.key && c.secret);
}

function headers(c: { key: string; secret: string }) {
  return {
    "x-core-key": c.key,
    "x-core-secret": c.secret,
    "Content-Type": "application/json",
  };
}

// Verify the key (used by the Integrations Test button).
export async function corePing(): Promise<{ ok: boolean; error?: string; name?: string; scopes?: string[] }> {
  const c = await cfg();
  if (!c.key || !c.secret) return { ok: false, error: "No CORE key/secret saved." };
  try {
    const res = await fetch(`${c.baseUrl}/api/core/ping`, { headers: headers(c), signal: AbortSignal.timeout(15000) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: j.error || `CORE ${res.status}` };
    return { ok: true, name: j.name, scopes: j.scopes };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// Send email THROUGH CORE (ZapMail by default; google_workspace for transactional).
export async function coreEmail(input: {
  to: string; subject: string; html: string; text?: string;
  provider?: "zapmail" | "google_workspace" | "smtp";
}): Promise<{ ok: boolean; error?: string }> {
  const c = await cfg();
  if (!c.key || !c.secret) return { ok: false, error: "CORE not configured" };
  try {
    const res = await fetch(`${c.baseUrl}/api/core/email`, {
      method: "POST",
      headers: headers(c),
      body: JSON.stringify({ ...input, provider: input.provider || "zapmail" }),
      signal: AbortSignal.timeout(20000),
    });
    const j = await res.json().catch(() => ({}));
    return { ok: res.ok && j.ok !== false, error: j.error };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// Push a lead into CORE's JV CRM (enriched + attributed).
export async function coreLead(input: {
  name: string; email?: string; phone?: string; zip?: string; state?: string;
  creatorRef?: string; notes?: string;
}): Promise<{ ok: boolean; leadId?: string; error?: string }> {
  const c = await cfg();
  if (!c.key || !c.secret) return { ok: false, error: "CORE not configured" };
  try {
    const res = await fetch(`${c.baseUrl}/api/core/lead`, {
      method: "POST",
      headers: headers(c),
      body: JSON.stringify({ creatorRef: "featureme", ...input }),
      signal: AbortSignal.timeout(20000),
    });
    const j = await res.json().catch(() => ({}));
    return { ok: res.ok && j.ok !== false, leadId: j.leadId, error: j.error };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// Called whenever a new FeatureMe customer signs up: add them to CORE's JV CRM
// and email Jeff. Best-effort — never blocks or fails the signup.
export async function onNewCustomer(input: {
  name?: string | null; email: string; phone?: string; planName?: string; source?: string;
}) {
  const name = input.name || input.email.split("@")[0];
  const notes = `FeatureMe signup${input.planName ? ` · plan: ${input.planName}` : ""}${input.source ? ` · via ${input.source}` : ""}`;

  await coreLead({ name, email: input.email, phone: input.phone, notes }).catch(() => {});

  await coreEmail({
    to: "jeff.cline@me.com",
    subject: `New FeatureMe customer: ${name}`,
    provider: "google_workspace",
    html: `<h2>New FeatureMe customer</h2>
      <p><b>Name:</b> ${name}<br/>
      <b>Email:</b> ${input.email}<br/>
      ${input.phone ? `<b>Phone:</b> ${input.phone}<br/>` : ""}
      ${input.planName ? `<b>Plan:</b> ${input.planName}<br/>` : ""}
      ${input.source ? `<b>Source:</b> ${input.source}<br/>` : ""}</p>
      <p>Added to the CORE JV CRM automatically.</p>`,
  }).catch(() => {});
}
