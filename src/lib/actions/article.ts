"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { syndicateArticle } from "@/lib/syndication";

export async function createArticleAction(_prev: unknown, formData: FormData) {
  const user = await currentUser();
  if (!user?.profile) return { error: "Create your profile first." };

  const title = String(formData.get("title") || "").trim();
  const bodyHtml = String(formData.get("bodyHtml") || "");
  const canonicalUrl = String(formData.get("canonicalUrl") || "").trim() || null;
  const publishNow = formData.get("publishNow") === "on";

  if (!title) return { error: "A title is required." };

  const article = await prisma.article.create({
    data: {
      profileId: user.profile.id,
      title,
      bodyHtml,
      canonicalUrl,
      status: publishNow ? "queued" : "draft",
    },
  });

  if (publishNow) {
    await syndicateArticle(article.id); // fan out to every enabled target
  }

  revalidatePath("/articles");
  redirect("/articles");
}

export async function syndicateAction(formData: FormData) {
  const user = await currentUser();
  if (!user?.profile) return;
  const id = String(formData.get("id") || "");
  const owns = await prisma.article.findFirst({ where: { id, profileId: user.profile.id } });
  if (!owns) return;
  await syndicateArticle(id);
  revalidatePath("/articles");
}
