"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { slugify, isReserved } from "@/lib/reserved";

export async function saveProfileAction(_prev: unknown, formData: FormData) {
  const user = await currentUser();
  if (!user) return { error: "Not signed in." };

  const desiredSlug = slugify(String(formData.get("slug") || ""));
  if (!desiredSlug) return { error: "A profile URL (slug) is required." };
  if (isReserved(desiredSlug)) return { error: `"${desiredSlug}" is reserved. Pick another URL.` };

  // Enforce slug uniqueness across other users.
  const clash = await prisma.profile.findUnique({ where: { slug: desiredSlug } });
  if (clash && clash.userId !== user.id) return { error: "That profile URL is taken." };

  const data = {
    slug: desiredSlug,
    displayName: String(formData.get("displayName") || "").trim() || user.name || "Member",
    headline: str(formData, "headline"),
    jobTitle: str(formData, "jobTitle"),
    company: str(formData, "company"),
    location: str(formData, "location"),
    bioHtml: String(formData.get("bioHtml") || ""),
    aboutHtml: String(formData.get("aboutHtml") || ""),
    profileImageUrl: str(formData, "profileImageUrl"),
    youtubeUrl: str(formData, "youtubeUrl"),
    seoTitle: str(formData, "seoTitle"),
    seoDescription: str(formData, "seoDescription"),
    keywords: String(formData.get("keywords") || "").trim(),
    published: formData.get("published") === "on",
  };

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  revalidatePath(`/${desiredSlug}`);
  revalidatePath("/");
  return { ok: true, message: "Profile saved." };
}

export async function addFaqAction(formData: FormData) {
  const user = await currentUser();
  if (!user?.profile) return;
  const question = String(formData.get("question") || "").trim();
  const answer = String(formData.get("answer") || "").trim();
  if (!question || !answer) return;
  const count = await prisma.faqItem.count({ where: { profileId: user.profile.id } });
  await prisma.faqItem.create({
    data: { profileId: user.profile.id, question, answer, order: count },
  });
  revalidatePath("/profile/edit");
  revalidatePath(`/${user.profile.slug}`);
}

export async function deleteFaqAction(formData: FormData) {
  const user = await currentUser();
  if (!user?.profile) return;
  const id = String(formData.get("id") || "");
  await prisma.faqItem.deleteMany({ where: { id, profileId: user.profile.id } });
  revalidatePath("/profile/edit");
  revalidatePath(`/${user.profile.slug}`);
}

export async function addPressLinkAction(formData: FormData) {
  const user = await currentUser();
  if (!user?.profile) return;
  const title = String(formData.get("title") || "").trim();
  const url = String(formData.get("url") || "").trim();
  if (!title || !url) return;
  await prisma.pressLink.create({
    data: { profileId: user.profile.id, title, url, publisher: str(formData, "publisher") },
  });
  revalidatePath("/profile/edit");
  revalidatePath(`/${user.profile.slug}`);
}

export async function deletePressLinkAction(formData: FormData) {
  const user = await currentUser();
  if (!user?.profile) return;
  const id = String(formData.get("id") || "");
  await prisma.pressLink.deleteMany({ where: { id, profileId: user.profile.id } });
  revalidatePath("/profile/edit");
  revalidatePath(`/${user.profile.slug}`);
}

function str(fd: FormData, key: string): string | null {
  const v = String(fd.get(key) || "").trim();
  return v || null;
}
