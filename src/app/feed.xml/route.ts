import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

// The always-on newsroom RSS feed: answer engines, Google News, and aggregators
// crawl this. Every syndicated release appears here, citing back to its source.
export async function GET() {
  const articles = await prisma.article.findMany({
    where: { status: "published" },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { profile: true },
  });

  const items = articles
    .map((a) => {
      const link = `${env.APP_URL}/${a.profile.slug}/news/${a.id}`;
      return `    <item>
      <title>${esc(a.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <dc:creator>${esc(a.profile.displayName)}</dc:creator>
      <pubDate>${a.createdAt.toUTCString()}</pubDate>
      ${a.canonicalUrl ? `<source url="${esc(a.canonicalUrl)}">${esc(a.canonicalUrl)}</source>` : ""}
      <description>${esc(strip(a.bodyHtml).slice(0, 300))}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${env.APP_NAME} Newsroom</title>
    <link>${env.APP_URL}</link>
    <description>News releases from featured members.</description>
${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function strip(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
