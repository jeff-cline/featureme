// Slugs that can never be used as a public profile handle, because they
// collide with app routes or are otherwise unsafe.
export const RESERVED_SLUGS = new Set([
  "login",
  "logout",
  "signup",
  "dashboard",
  "admin",
  "api",
  "articles",
  "article",
  "connections",
  "press",
  "profile",
  "settings",
  "account",
  "billing",
  "pricing",
  "r",
  "feed.xml",
  "sitemap.xml",
  "robots.txt",
  "_next",
  "favicon.ico",
  "about",
  "terms",
  "privacy",
  "static",
  "public",
  "u",
]);

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isReserved(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
