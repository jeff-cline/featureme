import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe, stripeConfig } from "@/lib/stripe";

// Stripe webhook: activates a subscription on successful checkout.
export async function POST(req: NextRequest) {
  const stripe = await getStripe();
  const cfg = await stripeConfig();
  if (!stripe || !cfg.webhookSecret) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const sig = req.headers.get("stripe-signature") || "";
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, cfg.webhookSecret);
  } catch (e) {
    return NextResponse.json({ error: `signature: ${e instanceof Error ? e.message : "bad"}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as { metadata?: { userId?: string; planKey?: string; coupon?: string }; subscription?: string };
    const userId = s.metadata?.userId;
    const planKey = s.metadata?.planKey || "basic";
    if (userId) {
      const plan = await prisma.plan.findUnique({ where: { key: planKey } });
      if (plan) {
        await prisma.subscription.upsert({
          where: { userId },
          update: { planId: plan.id, status: "active", stripeSubId: s.subscription ?? null },
          create: { userId, planId: plan.id, status: "active", stripeSubId: s.subscription ?? null },
        });
      }
      if (s.metadata?.coupon) {
        await prisma.coupon.updateMany({ where: { code: s.metadata.coupon }, data: { timesRedeemed: { increment: 1 } } });
      }
    }
  }

  return NextResponse.json({ received: true });
}
