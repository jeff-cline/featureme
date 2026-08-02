import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const PLANS = [
  { name: "Basic", price: 99, blurb: "Get listed and start earning citations.", features: ["2 news releases / mo", "8 syndicated posts / mo", "SEO profile page", "FAQ / schema"] },
  { name: "Mid", price: 299, blurb: "Consistent presence across platforms.", features: ["6 news releases / mo", "30 syndicated posts / mo", "All Basic features", "Priority syndication"], highlight: true },
  { name: "Advanced", price: 999, blurb: "Maximum reach for serious authority.", features: ["20 news releases / mo", "120 syndicated posts / mo", "All Mid features", "Managed outreach"] },
];

export default async function Home() {
  const profiles = await prisma.profile.findMany({
    where: { published: true },
    select: { slug: true, displayName: true, headline: true, keywords: true },
    orderBy: { updatedAt: "desc" },
  });

  // Build the keyword cloud: each keyword links back to that member's profile.
  const cloud: { term: string; slug: string }[] = [];
  for (const p of profiles) {
    cloud.push({ term: p.displayName, slug: p.slug });
    for (const kw of p.keywords.split(",").map((k) => k.trim()).filter(Boolean).slice(0, 4)) {
      cloud.push({ term: kw, slug: p.slug });
    }
  }

  return (
    <main>
      {/* Header */}
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight">FeatureMe</span>
          <nav className="flex items-center gap-4 text-sm">
            <a href="#pricing" className="text-neutral-600 hover:text-neutral-900">Pricing</a>
            <Link href="/login" className="rounded-md bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-800">Member sign in</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Get featured everywhere. Earn citations that answer engines trust.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-600">
          FeatureMe publishes one news release and syndicates it across trusted platforms — building
          real citations back to you, your brand, and your profile page. Built for executives,
          founders, and entrepreneurs.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <a href="#pricing" className="rounded-md bg-neutral-900 px-5 py-2.5 font-medium text-white hover:bg-neutral-800">See plans</a>
          <Link href="/login" className="rounded-md border border-neutral-300 px-5 py-2.5 font-medium hover:bg-neutral-50">Member sign in</Link>
        </div>
      </section>

      {/* Featured members — the keyword cloud (internal-link authority) */}
      {cloud.length > 0 && (
        <section className="border-y border-neutral-200 bg-neutral-50 py-14">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Featured members
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
              {cloud.map((c, i) => (
                <Link
                  key={i}
                  href={`/${c.slug}`}
                  className="text-neutral-700 hover:text-blue-700 hover:underline"
                  style={{ fontSize: `${0.9 + ((i * 7) % 5) * 0.18}rem` }}
                >
                  {c.term}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold">Simple monthly pricing</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`rounded-2xl border p-6 ${p.highlight ? "border-neutral-900 shadow-lg" : "border-neutral-200"}`}
            >
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-neutral-500">{p.blurb}</p>
              <p className="mt-4 text-4xl font-extrabold">
                ${p.price}
                <span className="text-base font-normal text-neutral-500">/mo</span>
              </p>
              <ul className="mt-5 space-y-2 text-sm text-neutral-700">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2"><span>✓</span>{f}</li>
                ))}
              </ul>
              <Link
                href={`/signup?plan=${p.name.toLowerCase()}`}
                className={`mt-6 block rounded-md px-4 py-2 text-center text-sm font-medium ${p.highlight ? "bg-neutral-900 text-white hover:bg-neutral-800" : "border border-neutral-300 hover:bg-neutral-50"}`}
              >
                Get started
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-neutral-200 py-8 text-center text-sm text-neutral-500">
        © {new Date().getFullYear()} FeatureMe · Built for founders and executives.
      </footer>
    </main>
  );
}
