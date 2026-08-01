"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { currentUser, hashPassword } from "@/lib/auth";
import { slugify, isReserved } from "@/lib/reserved";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

async function requireAdmin() {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

export async function createMemberAction(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const tempPassword = String(formData.get("tempPassword") || "").trim() || "Welcome!234";
  const planKey = String(formData.get("planKey") || "basic");
  let slug = slugify(String(formData.get("slug") || name || email.split("@")[0]));

  if (!email) return { error: "Email is required." };
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "A user with that email already exists." };

  // Ensure a unique, non-reserved slug.
  if (isReserved(slug)) slug = `${slug}-1`;
  let n = 1;
  while (await prisma.profile.findUnique({ where: { slug } })) slug = `${slugify(name || email.split("@")[0])}-${n++}`;

  const user = await prisma.user.create({
    data: {
      email,
      name,
      passwordHash: await hashPassword(tempPassword),
      role: "MEMBER",
      mustChangePassword: true,
      profile: {
        create: {
          slug,
          displayName: name || email.split("@")[0],
          keywords: name,
          published: false,
        },
      },
    },
  });

  const plan = await prisma.plan.findUnique({ where: { key: planKey } });
  if (plan) {
    await prisma.subscription.create({
      data: { userId: user.id, planId: plan.id, status: "trialing" },
    });
  }

  await sendEmail({
    to: email,
    subject: `Your FeatureMe account is ready`,
    html: `<p>Hi ${name || "there"},</p>
      <p>Your FeatureMe profile is set up at <a href="${env.APP_URL}/${slug}">${env.APP_URL}/${slug}</a>.</p>
      <p>Sign in at <a href="${env.APP_URL}/login">${env.APP_URL}/login</a> with:</p>
      <p>Email: ${email}<br/>Temporary password: <b>${tempPassword}</b></p>
      <p>You'll be asked to set a new password on first login.</p>`,
  });

  revalidatePath("/admin/members");
  return { ok: true, message: `Created ${email} → /${slug}` };
}

export async function createCouponAction(_prev: unknown, formData: FormData) {
  await requireAdmin();
  const code = String(formData.get("code") || "").trim().toUpperCase();
  if (!code) return { error: "Coupon code is required." };
  const percentOff = numOrNull(formData.get("percentOff"));
  const amountOff = numOrNull(formData.get("amountOff"));
  const maxRedemptions = numOrNull(formData.get("maxRedemptions"));

  if (!percentOff && !amountOff) return { error: "Set a percent-off or amount-off value." };

  const exists = await prisma.coupon.findUnique({ where: { code } });
  if (exists) return { error: "That coupon code already exists." };

  await prisma.coupon.create({
    data: {
      code,
      percentOff: percentOff ?? undefined,
      amountOffCents: amountOff ? amountOff * 100 : undefined,
      maxRedemptions: maxRedemptions ?? undefined,
      active: true,
    },
  });
  revalidatePath("/admin/coupons");
  return { ok: true, message: `Coupon ${code} created.` };
}

export async function toggleCouponAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const c = await prisma.coupon.findUnique({ where: { id } });
  if (!c) return;
  await prisma.coupon.update({ where: { id }, data: { active: !c.active } });
  revalidatePath("/admin/coupons");
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  const n = Number(String(v || "").trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}
