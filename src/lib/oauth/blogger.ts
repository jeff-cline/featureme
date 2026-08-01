import "server-only";
import { getIntegrationConfig } from "@/lib/integrations";
import { env } from "@/lib/env";

// Google OAuth + Blogger API v3. Client credentials live in the `blogger`
// integration (God account). Redirect URI must be registered in Google Cloud:
//   {APP_URL}/api/connect/blogger/callback
const AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/blogger";

export function redirectUri() {
  return `${env.APP_URL}/api/connect/blogger/callback`;
}

export async function buildAuthUrl(state: string): Promise<string | null> {
  const c = await getIntegrationConfig("blogger");
  if (!c.clientId) return null;
  const p = new URLSearchParams({
    client_id: c.clientId,
    redirect_uri: redirectUri(),
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${AUTH}?${p.toString()}`;
}

export async function exchangeCode(code: string): Promise<{ accessToken?: string; refreshToken?: string; error?: string }> {
  const c = await getIntegrationConfig("blogger");
  if (!c.clientId || !c.clientSecret) return { error: "Blogger client not configured." };
  try {
    const res = await fetch(TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: c.clientId,
        client_secret: c.clientSecret,
        redirect_uri: redirectUri(),
        grant_type: "authorization_code",
      }),
    });
    if (!res.ok) return { error: `token exchange ${res.status}` };
    const j = (await res.json()) as { access_token?: string; refresh_token?: string };
    return { accessToken: j.access_token, refreshToken: j.refresh_token };
  } catch (e) {
    return { error: String(e) };
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const c = await getIntegrationConfig("blogger");
  if (!c.clientId || !c.clientSecret) return null;
  try {
    const res = await fetch(TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: c.clientId,
        client_secret: c.clientSecret,
        grant_type: "refresh_token",
      }),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { access_token?: string };
    return j.access_token ?? null;
  } catch {
    return null;
  }
}

// List the authorized user's blogs; used to pick a default blogId at connect time.
export async function listBlogs(accessToken: string): Promise<{ id: string; name: string }[]> {
  try {
    const res = await fetch("https://www.googleapis.com/blogger/v3/users/self/blogs", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return [];
    const j = (await res.json()) as { items?: { id: string; name: string }[] };
    return j.items ?? [];
  } catch {
    return [];
  }
}

export async function postToBlogger(
  accessToken: string,
  blogId: string,
  title: string,
  html: string,
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const res = await fetch(`https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "blogger#post", title, content: html }),
    });
    if (!res.ok) return { ok: false, error: `blogger ${res.status}` };
    const j = (await res.json()) as { url?: string };
    return { ok: true, url: j.url };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
