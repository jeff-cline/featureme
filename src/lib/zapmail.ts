import "server-only";
import { prisma } from "./db";

// ---------------------------------------------------------------------------
// ZapMail API client — ported from the CORE platform. Provisions/represents
// Google Workspace mailboxes; auth header `x-auth-zapmail: <apiKey>` against
// https://api.zapmail.ai/api/v2. SMTP app passwords are exported via an async
// "MANUAL" export (.xlsx). We store per-mailbox SMTP creds in the `zapmail`
// integration config and rotate across them when sending (lib/email.ts).
// ---------------------------------------------------------------------------

const BASE = "https://api.zapmail.ai/api/v2";

export type ZapMailbox = {
  id: string; email: string; smtpUser: string; smtpPass: string;
  smtpHost: string; smtpPort: number; imapHost: string; imapPort: number;
};
export type ZapConfig = {
  apiKey?: string; workspaceId?: string; serviceProvider?: string;
  mailboxes?: ZapMailbox[]; rotateIdx?: number;
};

export async function getZapConfig(): Promise<ZapConfig | null> {
  const row = await prisma.integration.findUnique({ where: { key: "zapmail" } });
  if (!row) return null;
  try { return JSON.parse(row.config || "{}") as ZapConfig; } catch { return null; }
}

async function saveZapConfig(patch: Partial<ZapConfig>) {
  const cur = (await getZapConfig()) || {};
  const next = { ...cur, ...patch };
  await prisma.integration.upsert({
    where: { key: "zapmail" },
    update: { config: JSON.stringify(next), connected: true, status: "verified" },
    create: { key: "zapmail", label: "ZapMail — outbound email", config: JSON.stringify(next), connected: true, status: "verified" },
  });
  return next;
}

function headers(cfg: ZapConfig, withWorkspace = false): Record<string, string> {
  const h: Record<string, string> = { "x-auth-zapmail": cfg.apiKey || "", "Content-Type": "application/json" };
  if (withWorkspace && cfg.workspaceId) { h["x-workspace-key"] = cfg.workspaceId; h["x-service-provider"] = cfg.serviceProvider || "GOOGLE"; }
  return h;
}

async function api<T = unknown>(path: string, cfg: ZapConfig, init: RequestInit = {}, withWorkspace = false): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...headers(cfg, withWorkspace), ...(init.headers || {}) }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch { return null; }
}

// True if the API key authenticates (used by the integration Test button).
export async function verifyZapmailApi(cfg?: ZapConfig): Promise<{ ok: boolean; workspaceId?: string; mailboxes?: number; error?: string }> {
  const c = cfg || (await getZapConfig());
  if (!c?.apiKey) return { ok: false, error: "No ZapMail API key saved." };
  const ws = await api<{ data?: { currentWorkspace?: { id?: string; activeMailboxCountGoogle?: string } } }>("/workspaces", c);
  if (!ws?.data?.currentWorkspace?.id) return { ok: false, error: "ZapMail rejected the API key (check Dashboard → Settings → API)." };
  return { ok: true, workspaceId: ws.data.currentWorkspace.id, mailboxes: parseInt(ws.data.currentWorkspace.activeMailboxCountGoogle || "0", 10) };
}

type DomainsResp = { data?: { domains?: { domain: string; mailboxes?: { id: string; username: string }[] }[] } };
export async function listMailboxes(cfg: ZapConfig): Promise<{ id: string; email: string }[]> {
  const d = await api<DomainsResp>("/domains?limit=100", cfg);
  const out: { id: string; email: string }[] = [];
  for (const dom of d?.data?.domains || []) for (const m of dom.mailboxes || []) out.push({ id: m.id, email: `${m.username}@${dom.domain}` });
  return out;
}

export async function exportCredentialsLink(cfg: ZapConfig, ids: string[]): Promise<string | null> {
  const r = await api<{ data?: { csvExportedLink?: string } }>("/exports/mailboxes", cfg, { method: "POST", body: JSON.stringify({ apps: ["MANUAL"], ids }) }, true);
  return r?.data?.csvExportedLink || null;
}

export async function parseCredentialXlsx(url: string): Promise<ZapMailbox[]> {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) return [];
  const buf = Buffer.from(await res.arrayBuffer());
  const { default: unzip } = await import("./unzip");
  const files = unzip(buf);
  const ss = parseSharedStrings(files["xl/sharedStrings.xml"] || "");
  const sheetKeys = Object.keys(files).filter((k) => /xl\/worksheets\/sheet\d+\.xml$/.test(k)).sort();
  let grid: Record<string, string>[] = [];
  for (const key of sheetKeys) {
    const g = parseSheet(files[key] || "", ss);
    if (g.length >= 2 && Object.values(g[0]).some((v) => /App Password|SMTP Password|SMTP Username/i.test(String(v)))) { grid = g; break; }
  }
  if (grid.length < 2) return [];
  const header = grid[0];
  const colByName: Record<string, string> = {};
  for (const [letter, val] of Object.entries(header)) colByName[String(val).trim()] = letter;
  const get = (row: Record<string, string>, name: string) => (colByName[name] ? row[colByName[name]] || "" : "");
  const mbs: ZapMailbox[] = [];
  for (let i = 1; i < grid.length; i++) {
    const row = grid[i];
    const email = get(row, "Email");
    if (!email) continue;
    mbs.push({
      id: "", email,
      smtpUser: get(row, "SMTP Username") || email,
      smtpPass: (get(row, "SMTP Password") || get(row, "App Password")).replace(/\s+/g, ""),
      smtpHost: get(row, "SMTP Host") || "smtp.gmail.com",
      smtpPort: parseInt(get(row, "SMTP Port") || "587", 10),
      imapHost: get(row, "IMAP Host") || "imap.gmail.com",
      imapPort: parseInt(get(row, "IMAP Port") || "993", 10),
    });
  }
  return mbs;
}

// Full refresh: verify key → list mailboxes → export creds → store. Returns count stored.
export async function refreshMailboxes(): Promise<{ ok: boolean; stored: number; error?: string }> {
  let cfg = await getZapConfig();
  if (!cfg?.apiKey) return { ok: false, stored: 0, error: "No ZapMail API key." };
  const v = await verifyZapmailApi(cfg);
  if (!v.ok) return { ok: false, stored: 0, error: v.error };
  cfg = await saveZapConfig({ workspaceId: v.workspaceId, serviceProvider: "GOOGLE" });

  const list = await listMailboxes(cfg);
  if (!list.length) return { ok: false, stored: 0, error: "No mailboxes found." };
  const link = await exportCredentialsLink(cfg, list.map((m) => m.id));
  if (!link) return { ok: false, stored: 0, error: "Export request failed (rate limit ~3/mailbox/week)." };

  let mbs: ZapMailbox[] = [];
  for (let attempt = 0; attempt < 6 && mbs.length === 0; attempt++) {
    await new Promise((r) => setTimeout(r, 2500));
    mbs = await parseCredentialXlsx(link).catch(() => []);
  }
  const idByEmail = new Map(list.map((m) => [m.email.toLowerCase(), m.id]));
  for (const m of mbs) m.id = idByEmail.get(m.email.toLowerCase()) || "";
  const usable = mbs.filter((m) => m.smtpUser && m.smtpPass);
  if (!usable.length) return { ok: false, stored: 0, error: "Export produced no usable SMTP creds yet — try again in a minute." };
  await saveZapConfig({ mailboxes: usable });
  return { ok: true, stored: usable.length };
}

// Pick the next mailbox round-robin (deliverability), advancing the saved index.
export async function nextMailbox(): Promise<ZapMailbox | null> {
  const cfg = await getZapConfig();
  const mbs = cfg?.mailboxes || [];
  if (!mbs.length) return null;
  const idx = (cfg?.rotateIdx || 0) % mbs.length;
  await saveZapConfig({ rotateIdx: idx + 1 });
  return mbs[idx];
}

// ---- tiny xlsx helpers -----------------------------------------------------
function parseSharedStrings(xml: string): string[] {
  const out: string[] = [];
  const re = /<si>([\s\S]*?)<\/si>/g; let m;
  while ((m = re.exec(xml))) {
    const texts = [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => decodeXml(x[1]));
    out.push(texts.join(""));
  }
  return out;
}
function parseSheet(xml: string, ss: string[]): Record<string, string>[] {
  const rows: Record<string, string>[] = [];
  for (const rowM of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: Record<string, string> = {};
    for (const cM of rowM[1].matchAll(/<c r="([A-Z]+)\d+"(?:[^>]*\bt="([^"]*)")?[^>]*>([\s\S]*?)<\/c>/g)) {
      const col = cM[1], t = cM[2], inner = cM[3];
      const vM = inner.match(/<v>([\s\S]*?)<\/v>/);
      let val = vM ? vM[1] : "";
      if (t === "s") val = ss[parseInt(val, 10)] || "";
      else if (t === "inlineStr") { const im = inner.match(/<t[^>]*>([\s\S]*?)<\/t>/); val = im ? decodeXml(im[1]) : ""; }
      else val = decodeXml(val);
      row[col] = val;
    }
    rows.push(row);
  }
  return rows;
}
function decodeXml(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
}
