"use server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";
import { slugify, isReserved } from "@/lib/reserved";
import { onNewCustomer } from "@/lib/core";

export async function signupAction(_prev: unknown, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const planKey = String(formData.get("planKey") || "basic");

  if (!name || !email || password.length < 8) {
    return { error: "Name, email, and a password of at least 8 characters are required." };
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    return { error: "An account with that email already exists — try signing in." };
  }

  // Unique, non-reserved slug from the name.
  let slug = slugify(name) || slugify(email.split("@")[0]);
  if (isReserved(slug)) slug = `${slug}-1`;
  let n = 1;
  while (await prisma.profile.findUnique({ where: { slug } })) slug = `${slugify(name)}-${n++}`;

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(password),
      role: "MEMBER",
      mustChangePassword: false,
      profile: { create: { slug, displayName: name, keywords: name, published: false } },
    },
  });

  const plan = await prisma.plan.findUnique({ where: { key: planKey } });
  if (plan) {
    await prisma.subscription.create({ data: { userId: user.id, planId: plan.id, status: "trialing" } });
  }

  // Add to CORE JV CRM + email Jeff (best-effort; never blocks signup).
  await onNewCustomer({ name, email, planName: plan?.name, source: "self-signup" });

  await createSession({ uid: user.id, role: "MEMBER" });
  redirect("/profile/edit");
}
