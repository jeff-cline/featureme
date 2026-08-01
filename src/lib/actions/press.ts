"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// A member marks that they answered an opportunity (idempotent).
export async function markRespondedAction(formData: FormData) {
  const user = await currentUser();
  if (!user) return;
  const opportunityId = String(formData.get("opportunityId") || "");
  if (!opportunityId) return;
  await prisma.pressResponse.upsert({
    where: { opportunityId_userId: { opportunityId, userId: user.id } },
    update: {},
    create: { opportunityId, userId: user.id },
  });
  revalidatePath("/press");
}

// Admin adds a journalist/earned-media opportunity to the shared inbox.
export async function createOpportunityAction(_prev: unknown, formData: FormData) {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") return { error: "Forbidden" };
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Title is required." };
  const deadlineRaw = String(formData.get("deadline") || "").trim();
  await prisma.pressOpportunity.create({
    data: {
      title,
      outlet: str(formData, "outlet"),
      category: str(formData, "category"),
      query: String(formData.get("query") || "").trim(),
      url: str(formData, "url"),
      source: String(formData.get("source") || "manual"),
      deadline: deadlineRaw ? new Date(deadlineRaw) : null,
    },
  });
  revalidatePath("/press");
  return { ok: true, message: "Opportunity added." };
}

function str(fd: FormData, key: string): string | null {
  const v = String(fd.get(key) || "").trim();
  return v || null;
}
