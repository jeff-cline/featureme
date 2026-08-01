import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

async function getArticle(slug: string, id: string) {
  const a = await prisma.article.findUnique({ where: { id }, include: { profile: true } });
  if (!a || a.profile.slug !== slug) return null;
  return a;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const a = await getArticle(slug, id);
  if (!a) return { title: "Not found" };
  // If the release cites an external source, point canonical there (hub-and-spoke).
  const canonical = a.canonicalUrl || `${env.APP_URL}/${slug}/news/${a.id}`;
  return {
    title: a.title,
    description: `${a.title} — ${a.profile.displayName}`,
    alternates: { canonical },
    openGraph: { title: a.title, type: "article", url: `${env.APP_URL}/${slug}/news/${a.id}` },
  };
}

export default async function NewsPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const a = await getArticle(slug, id);
  if (!a) notFound();

  const ld = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: a.title,
    datePublished: a.createdAt.toISOString(),
    dateModified: a.updatedAt.toISOString(),
    author: { "@type": "Person", name: a.profile.displayName, url: `${env.APP_URL}/${slug}` },
    mainEntityOfPage: a.canonicalUrl || `${env.APP_URL}/${slug}/news/${a.id}`,
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <p className="text-sm text-neutral-400">
        <Link href={`/${slug}`} className="hover:underline">{a.profile.displayName}</Link> · News
      </p>
      <h1 className="mt-2 text-3xl font-extrabold">{a.title}</h1>
      <p className="mt-1 text-sm text-neutral-400">{a.createdAt.toLocaleDateString()}</p>
      <article className="richtext mt-8" dangerouslySetInnerHTML={{ __html: a.bodyHtml }} />
      {a.canonicalUrl && (
        <p className="mt-10 rounded-lg bg-neutral-50 p-4 text-sm text-neutral-600">
          Originally published at{" "}
          <a href={a.canonicalUrl} target="_blank" rel="canonical" className="text-blue-700 underline">{a.canonicalUrl}</a>.
        </p>
      )}
    </main>
  );
}
