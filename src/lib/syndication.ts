import "server-only";
import { prisma } from "./db";
import { env } from "./env";

// One-in, many-out. Each adapter knows how to push an article to one platform.
// Adapters that need credentials read them from the member's Connection row.
// This keeps the "connect once, post forever" model: the member authorizes each
// platform, and from then on syndication is programmatic.

export type PushResult = {
  status: "posted" | "failed" | "skipped";
  remoteUrl?: string;
  error?: string;
};

export type ArticleForPush = {
  id: string;
  title: string;
  bodyHtml: string;
  canonicalUrl: string | null;
  slug: string; // profile slug
};

type Adapter = {
  key: string;
  push: (a: ArticleForPush, connectionMeta: Record<string, string> | null) => Promise<PushResult>;
};

// --- Newsroom: always-on, no external auth. The article lives at
//     /{slug}/news/{articleId} and is included in the RSS feed answer engines crawl.
const newsroom: Adapter = {
  key: "newsroom",
  async push(a) {
    return { status: "posted", remoteUrl: `${env.APP_URL}/${a.slug}/news/${a.id}` };
  },
};

// --- DEV (dev.to): real API, member supplies an API key. Honors canonical_url.
const devto: Adapter = {
  key: "devto",
  async push(a, meta) {
    const key = meta?.apiKey;
    if (!key) return { status: "skipped", error: "no dev.to API key connected" };
    try {
      const res = await fetch("https://dev.to/api/articles", {
        method: "POST",
        headers: { "api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          article: {
            title: a.title,
            body_markdown: htmlToMarkdownish(a.bodyHtml),
            published: true,
            canonical_url: a.canonicalUrl ?? `${env.APP_URL}/${a.slug}/news/${a.id}`,
          },
        }),
      });
      if (!res.ok) return { status: "failed", error: `dev.to ${res.status}` };
      const json = (await res.json()) as { url?: string };
      return { status: "posted", remoteUrl: json.url };
    } catch (e) {
      return { status: "failed", error: String(e) };
    }
  },
};

// --- Hashnode: GraphQL API, member supplies a personal access token.
const hashnode: Adapter = {
  key: "hashnode",
  async push(a, meta) {
    if (!meta?.token || !meta?.publicationId)
      return { status: "skipped", error: "no Hashnode token/publication connected" };
    // Left as a real integration point; skipped until token present so the queue never blocks.
    return { status: "skipped", error: "hashnode adapter pending publication config" };
  },
};

// OAuth-based platforms (Medium, Blogger, LinkedIn) require a per-member OAuth
// grant. Until connected they cleanly skip rather than fail the whole run.
function oauthPlaceholder(key: string): Adapter {
  return {
    key,
    async push(_a, meta) {
      if (!meta?.accessToken)
        return { status: "skipped", error: `${key} not authorized yet` };
      return { status: "skipped", error: `${key} adapter pending platform app registration` };
    },
  };
}

// Blogger: real Google OAuth adapter. Uses the member's stored token + blogId;
// refreshes the access token on 401 via the refresh token.
const blogger: Adapter = {
  key: "blogger",
  async push(a, meta) {
    if (!meta?.accessToken || !meta?.blogId)
      return { status: "skipped", error: "Blogger not connected" };
    const { postToBlogger, refreshAccessToken } = await import("./oauth/blogger");
    const body = a.canonicalUrl
      ? `${a.bodyHtml}<p><em>Originally published at <a href="${a.canonicalUrl}" rel="canonical">${a.canonicalUrl}</a>.</em></p>`
      : a.bodyHtml;
    let r = await postToBlogger(meta.accessToken, meta.blogId, a.title, body);
    if (!r.ok && meta.refreshToken) {
      const fresh = await refreshAccessToken(meta.refreshToken);
      if (fresh) r = await postToBlogger(fresh, meta.blogId, a.title, body);
    }
    return r.ok ? { status: "posted", remoteUrl: r.url } : { status: "failed", error: r.error };
  },
};

const ADAPTERS: Record<string, Adapter> = {
  newsroom: newsroom,
  devto: devto,
  hashnode: hashnode,
  medium: oauthPlaceholder("medium"),
  blogger: blogger,
  tumblr: oauthPlaceholder("tumblr"),
  linkedin: oauthPlaceholder("linkedin"),
};

// Push one article to every enabled target the member has (or the always-on ones).
export async function syndicateArticle(articleId: string) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { profile: { include: { user: { include: { connections: true } } } } },
  });
  if (!article) return;

  const targets = await prisma.syndicationTarget.findMany({ where: { enabled: true } });
  const connections = article.profile.user.connections;

  const payload: ArticleForPush = {
    id: article.id,
    title: article.title,
    bodyHtml: article.bodyHtml,
    canonicalUrl: article.canonicalUrl,
    slug: article.profile.slug,
  };

  for (const t of targets) {
    const adapter = ADAPTERS[t.key];
    if (!adapter) continue;

    // Build the meta bag from the member's connection for this target.
    const conn = connections.find((c) => c.targetKey === t.key && c.status === "connected");
    const meta: Record<string, string> = {};
    if (conn?.accessToken) meta.accessToken = conn.accessToken;
    if (conn?.refreshToken) meta.refreshToken = conn.refreshToken;
    if (conn?.meta) {
      try {
        Object.assign(meta, JSON.parse(conn.meta));
      } catch {}
    }

    const existing = await prisma.syndication.findFirst({
      where: { articleId: article.id, targetKey: t.key },
    });
    const result = await adapter.push(payload, Object.keys(meta).length ? meta : null);
    const data = {
      status: result.status,
      remoteUrl: result.remoteUrl ?? null,
      error: result.error ?? null,
      postedAt: result.status === "posted" ? new Date() : null,
    };
    if (existing) {
      await prisma.syndication.update({ where: { id: existing.id }, data });
    } else {
      await prisma.syndication.create({ data: { articleId: article.id, targetKey: t.key, ...data } });
    }
  }

  await prisma.article.update({ where: { id: article.id }, data: { status: "published" } });
}

// Very small HTML->markdown-ish converter for platforms that want markdown.
function htmlToMarkdownish(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gis, "# $1\n\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gis, "## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gis, "### $1\n\n")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis, "[$2]($1)")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gis, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gis, "*$1*")
    .replace(/<li[^>]*>(.*?)<\/li>/gis, "- $1\n")
    .replace(/<img[^>]*src="([^"]*)"[^>]*>/gis, "![]($1)")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
