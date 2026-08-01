import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "jeffcline@me.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "TEMP!234";

  // ---- God / admin account (forced password change on first login) ----
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      name: "Jeff Cline",
      role: "ADMIN",
      mustChangePassword: true,
    },
  });

  // Give the admin a public profile too, so featureme.io/jeff-cline works.
  await prisma.profile.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      slug: "jeff-cline",
      displayName: "Jeff Cline",
      headline: "Founder — helping executives get featured across the web",
      jobTitle: "Founder",
      company: "FeatureMe",
      keywords: "Jeff Cline, personal branding, AEO, executive branding",
      seoTitle: "Jeff Cline — Founder, FeatureMe",
      seoDescription:
        "Jeff Cline helps executives, founders, and entrepreneurs get featured across the web to earn citations and authority.",
      published: true,
    },
  });

  // ---- Pricing plans ----
  const plans = [
    { key: "basic", name: "Basic", priceCents: 9900, articlesPerMonth: 2, postsPerMonth: 8, engagementsPerMonth: 20 },
    { key: "mid", name: "Mid", priceCents: 29900, articlesPerMonth: 6, postsPerMonth: 30, engagementsPerMonth: 100 },
    { key: "advanced", name: "Advanced", priceCents: 99900, articlesPerMonth: 20, postsPerMonth: 120, engagementsPerMonth: 500 },
  ];
  for (const p of plans) {
    await prisma.plan.upsert({ where: { key: p.key }, update: p, create: p });
  }

  // ---- Outbound syndication targets (connect-once catalog) ----
  const targets = [
    { key: "newsroom", name: "FeatureMe Newsroom (RSS)", kind: "rss", enabled: true, notes: "Always on. Publishes to the on-site newsroom + RSS feed that answer engines and aggregators crawl." },
    { key: "medium", name: "Medium", kind: "oauth", enabled: true, notes: "Canonical import. Requires member OAuth authorization." },
    { key: "devto", name: "DEV (dev.to)", kind: "apikey", enabled: true, notes: "Member pastes an API key. Supports canonical_url." },
    { key: "hashnode", name: "Hashnode", kind: "apikey", enabled: true, notes: "Member pastes a personal access token." },
    { key: "blogger", name: "Blogger", kind: "oauth", enabled: true, notes: "Google OAuth. Requires a Google Cloud app + member authorization." },
    { key: "tumblr", name: "Tumblr", kind: "oauth", enabled: false, notes: "OAuth. Off until app registered." },
    { key: "linkedin", name: "LinkedIn (Org page)", kind: "oauth", enabled: false, notes: "OAuth. Off until app registered + review approved." },
  ];
  for (const t of targets) {
    await prisma.syndicationTarget.upsert({ where: { key: t.key }, update: t, create: t });
  }

  // ---- A sample welcome coupon ----
  await prisma.coupon.upsert({
    where: { code: "FOUNDER50" },
    update: {},
    create: { code: "FOUNDER50", percentOff: 50, active: true, maxRedemptions: 100 },
  });

  console.log(`Seeded admin=${adminEmail}, ${plans.length} plans, ${targets.length} targets.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
