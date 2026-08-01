"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";

// Connect an API-key based platform (dev.to, Hashnode). OAuth platforms are
// handled by a redirect flow the member initiates; those store tokens the same way.
export async function connectApiKeyAction(formData: FormData) {
  const user = await currentUser();
  if (!user) return;
  const targetKey = String(formData.get("targetKey") || "");
  const apiKey = String(formData.get("apiKey") || "").trim();
  const extra = String(formData.get("extra") || "").trim(); // e.g. Hashnode publicationId

  const meta: Record<string, string> = {};
  if (targetKey === "devto") meta.apiKey = apiKey;
  if (targetKey === "hashnode") {
    meta.token = apiKey;
    if (extra) meta.publicationId = extra;
  }

  await prisma.connection.upsert({
    where: { userId_targetKey: { userId: user.id, targetKey } },
    update: { status: apiKey ? "connected" : "disconnected", meta: JSON.stringify(meta) },
    create: {
      userId: user.id,
      targetKey,
      status: apiKey ? "connected" : "disconnected",
      meta: JSON.stringify(meta),
    },
  });
  revalidatePath("/connections");
}

export async function disconnectAction(formData: FormData) {
  const user = await currentUser();
  if (!user) return;
  const targetKey = String(formData.get("targetKey") || "");
  await prisma.connection.updateMany({
    where: { userId: user.id, targetKey },
    data: { status: "disconnected", accessToken: null, meta: null },
  });
  revalidatePath("/connections");
}
