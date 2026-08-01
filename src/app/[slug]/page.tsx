import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { isReserved } from "@/lib/reserved";

export const dynamic = "force-dynamic";

async function getProfile(slug: string) {
  if (isReserved(slug)) return null;
  return prisma.profile.findFirst({
    where: { slug, published: true },
    include: {
      faqs: { orderBy: { order: "asc" } },
      pressLinks: { orderBy: { order: "asc" } },
      articles: { where: { status: "published" }, orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProfile(slug);
  if (!p) return { title: "Not found" };
  const title = p.seoTitle || `${p.displayName}${p.jobTitle ? ` — ${p.jobTitle}` : ""}`;
  const description = p.seoDescription || p.headline || `Learn about ${p.displayName}.`;
  return {
    title,
    description,
    alternates: { canonical: `${env.APP_URL}/${p.slug}` },
    openGraph: {
      title,
      description,
      url: `${env.APP_URL}/${p.slug}`,
      type: "profile",
      images: p.profileImageUrl ? [p.profileImageUrl] : undefined,
    },
    twitter: { card: "summary", title, description },
  };
}

function youtubeEmbed(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default async function ProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProfile(slug);
  if (!p) notFound();

  // Log a view (best-effort; never blocks render).
  prisma.clickEvent.create({ data: { profileId: p.id, kind: "view", path: `/${p.slug}` } }).catch(() => {});

  const embed = p.youtubeUrl ? youtubeEmbed(p.youtubeUrl) : null;

  // JSON-LD: Person + (optional) FAQPage for answer engines.
  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.displayName,
    jobTitle: p.jobTitle || undefined,
    worksFor: p.company ? { "@type": "Organization", name: p.company } : undefined,
    address: p.location || undefined,
    image: p.profileImageUrl || undefined,
    url: `${env.APP_URL}/${p.slug}`,
    sameAs: [p.youtubeUrl, ...p.pressLinks.map((l) => l.url)].filter(Boolean),
    description: p.seoDescription || p.headline || undefined,
  };
  const faqLd = p.faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: p.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }
    : null;

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />}

      <header className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
        {p.profileImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.profileImageUrl}
            alt={`${p.displayName}${p.jobTitle ? `, ${p.jobTitle}` : ""}`}
            className="h-28 w-28 rounded-full object-cover"
          />
        )}
        <div className="sm:ml-6">
          <h1 className="text-3xl font-extrabold">{p.displayName}</h1>
          {(p.jobTitle || p.company) && (
            <p className="mt-1 text-neutral-600">
              {[p.jobTitle, p.company].filter(Boolean).join(" · ")}
            </p>
          )}
          {p.headline && <p className="mt-2 text-lg text-neutral-700">{p.headline}</p>}
          {p.location && <p className="mt-1 text-sm text-neutral-400">{p.location}</p>}
        </div>
      </header>

      {p.bioHtml && (
        <section className="richtext mt-8" dangerouslySetInnerHTML={{ __html: p.bioHtml }} />
      )}

      {embed && (
        <section className="mt-8">
          <div className="relative aspect-video overflow-hidden rounded-xl">
            <iframe className="absolute inset-0 h-full w-full" src={embed} title={`${p.displayName} video`} allowFullScreen />
          </div>
        </section>
      )}

      {p.aboutHtml && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">About</h2>
          <div className="richtext mt-3" dangerouslySetInnerHTML={{ __html: p.aboutHtml }} />
        </section>
      )}

      {p.pressLinks.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">In the press</h2>
          <ul className="mt-3 space-y-2">
            {p.pressLinks.map((l) => (
              <li key={l.id}>
                <a href={`/r/${l.id}?k=press`} className="text-blue-700 hover:underline">
                  {l.title}{l.publisher ? ` — ${l.publisher}` : ""}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {p.articles.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">Latest news</h2>
          <ul className="mt-3 space-y-2">
            {p.articles.map((a) => (
              <li key={a.id}>
                <Link href={`/${p.slug}/news/${a.id}`} className="text-blue-700 hover:underline">{a.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {p.faqs.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold">Frequently asked questions</h2>
          <div className="mt-3 space-y-4">
            {p.faqs.map((f) => (
              <div key={f.id}>
                <h3 className="font-semibold">{f.question}</h3>
                <p className="mt-1 text-neutral-700">{f.answer}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="mt-16 border-t border-neutral-200 pt-6 text-sm text-neutral-400">
        <Link href="/" className="hover:underline">Featured on FeatureMe</Link>
      </footer>
    </main>
  );
}
