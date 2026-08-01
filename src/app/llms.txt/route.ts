import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

// llms.txt — a plain-text index for LLM crawlers. Value is unproven (per our
// research) but it's cheap and harmless: point them at the profiles + newsroom.
export async function GET() {
  const profiles = await prisma.profile.findMany({
    where: { published: true },
    select: { slug: true, displayName: true, headline: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });

  const lines = [
    `# ${env.APP_NAME}`,
    ``,
    `> Personal-branding profiles and news releases for executives, founders, and entrepreneurs.`,
    ``,
    `## Newsroom`,
    `- [Newsroom RSS](${env.APP_URL}/feed.xml)`,
    ``,
    `## Featured members`,
    ...profiles.map((p) => `- [${p.displayName}${p.headline ? ` — ${p.headline}` : ""}](${env.APP_URL}/${p.slug})`),
    ``,
  ].join("\n");

  return new Response(lines, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
