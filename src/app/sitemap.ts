import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.APP_URL;
  const profiles = await prisma.profile.findMany({
    where: { published: true },
    select: { slug: true, updatedAt: true, articles: { where: { status: "published" }, select: { id: true, updatedAt: true } } },
  });

  const entries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
  ];
  for (const p of profiles) {
    entries.push({ url: `${base}/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly", priority: 0.8 });
    for (const a of p.articles) {
      entries.push({ url: `${base}/${p.slug}/news/${a.id}`, lastModified: a.updatedAt, changeFrequency: "monthly", priority: 0.6 });
    }
  }
  return entries;
}
