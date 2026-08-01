import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { stripeConfig } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const metadata = { title: "Billing" };

export default async function BillingPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  const [plans, cfg] = await Promise.all([
    prisma.plan.findMany({ orderBy: { priceCents: "asc" } }),
    stripeConfig(),
  ]);
  const billingLive = Boolean(cfg.secretKey);
  const current = user.subscription;

  return (
    <div>
      <h1 className="text-2xl font-bold">Billing</h1>
      <p className="mt-1 text-neutral-600">
        {current ? <>Current plan: <b>{current.plan.name}</b> ({current.status}).</> : "Choose a plan to get featured."}
      </p>

      {!billingLive && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Checkout activates once the owner adds Stripe keys in Integrations. Plans and coupons are ready.
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {plans.map((p) => (
          <form key={p.id} method="POST" action="/api/billing/checkout" className="rounded-2xl border border-neutral-200 bg-white p-6">
            <input type="hidden" name="planKey" value={p.key} />
            <h3 className="text-lg font-semibold">{p.name}</h3>
            <p className="mt-2 text-3xl font-extrabold">${p.priceCents / 100}<span className="text-base font-normal text-neutral-500">/mo</span></p>
            <ul className="mt-4 space-y-1 text-sm text-neutral-700">
              <li>✓ {p.articlesPerMonth} news releases / mo</li>
              <li>✓ {p.postsPerMonth} syndicated posts / mo</li>
              <li>✓ {p.engagementsPerMonth} engagements / mo</li>
            </ul>
            <input name="coupon" placeholder="Coupon code" className="mt-4 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            <button
              disabled={!billingLive}
              className="mt-3 w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {billingLive ? "Subscribe" : "Coming soon"}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
