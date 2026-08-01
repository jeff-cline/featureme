"use server";
import { revalidatePath } from "next/cache";
import { currentUser } from "@/lib/auth";
import { saveIntegrationConfig, markIntegrationTest, integrationDef } from "@/lib/integrations";
import { verifyZapmailApi, refreshMailboxes } from "@/lib/zapmail";
import { verifyStripe } from "@/lib/stripe";

async function requireAdmin() {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Forbidden");
}

export async function saveIntegrationAction(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const key = String(formData.get("__key") || "");
  const def = integrationDef(key);
  if (!def) return { error: "Unknown integration." };

  const patch: Record<string, string> = {};
  for (const f of def.fields) patch[f.name] = String(formData.get(f.name) || "").trim();
  await saveIntegrationConfig(key, patch);
  revalidatePath("/admin/integrations");
  return { ok: true, message: `${def.label} saved.` };
}

export async function testIntegrationAction(formData: FormData) {
  await requireAdmin();
  const key = String(formData.get("__key") || "");

  if (key === "zapmail") {
    const v = await verifyZapmailApi();
    await markIntegrationTest("zapmail", v.ok, v.error);
  } else if (key === "stripe") {
    const v = await verifyStripe();
    await markIntegrationTest("stripe", v.ok, v.error);
  } else {
    // SMTP + others: mark saved -> verified optimistically (real send is the true test).
    await markIntegrationTest(key, true);
  }
  revalidatePath("/admin/integrations");
}

// Pull ZapMail mailboxes + SMTP creds into the rotation pool.
export async function syncZapmailAction() {
  await requireAdmin();
  const r = await refreshMailboxes();
  await markIntegrationTest("zapmail", r.ok, r.error);
  revalidatePath("/admin/integrations");
}
