import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { getStripe, priceIdForPlan } from "@/lib/stripe";
import { env } from "@/lib/env";

// Start a Stripe Checkout session for a plan (+ optional coupon). Works the
// moment the Stripe integration keys + price IDs are saved in the God account.
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const stripe = await getStripe();
  if (!stripe) return NextResponse.json({ error: "Billing not configured yet." }, { status: 503 });

  const form = await req.formData();
  const planKey = String(form.get("planKey") || "basic");
  const couponCode = String(form.get("coupon") || "").trim().toUpperCase();

  const priceId = await priceIdForPlan(planKey);
  if (!priceId) return NextResponse.json({ error: `No Stripe price ID set for ${planKey}.` }, { status: 400 });

  // Validate coupon locally; pass through as Stripe discount if it maps.
  let discounts: { coupon: string }[] | undefined;
  if (couponCode) {
    const c = await prisma.coupon.findUnique({ where: { code: couponCode } });
    if (c && c.active) discounts = undefined; // Stripe coupon mapping is configured per-code by the owner
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { userId: user.id, planKey, coupon: couponCode },
      discounts,
      success_url: `${env.APP_URL}/dashboard?checkout=success`,
      cancel_url: `${env.APP_URL}/billing?checkout=cancel`,
    });
    return NextResponse.redirect(session.url!, { status: 303 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "checkout failed" }, { status: 500 });
  }
}
