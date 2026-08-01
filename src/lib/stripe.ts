import "server-only";
import Stripe from "stripe";
import { getIntegrationConfig } from "./integrations";

// Construct a Stripe client from the DB-stored integration key (or null if not set).
export async function getStripe(): Promise<Stripe | null> {
  const c = await getIntegrationConfig("stripe");
  if (!c.secretKey) return null;
  return new Stripe(c.secretKey);
}

export async function stripeConfig() {
  return getIntegrationConfig("stripe");
}

// Map a plan key -> configured Stripe price id.
export async function priceIdForPlan(planKey: string): Promise<string | null> {
  const c = await getIntegrationConfig("stripe");
  const map: Record<string, string | undefined> = {
    basic: c.priceBasic,
    mid: c.priceMid,
    advanced: c.priceAdvanced,
  };
  return map[planKey] || null;
}

// Verify the secret key works (used by the integration Test button).
export async function verifyStripe(): Promise<{ ok: boolean; error?: string }> {
  const s = await getStripe();
  if (!s) return { ok: false, error: "No Stripe secret key saved." };
  try {
    await s.balance.retrieve();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Stripe rejected the key." };
  }
}
