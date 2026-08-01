import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { stripeEnabled } from "@/lib/env";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminOverview() {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const [members, published, articles, posted, coupons] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.profile.count({ where: { published: true } }),
    prisma.article.count(),
    prisma.syndication.count({ where: { status: "posted" } }),
    prisma.coupon.count({ where: { active: true } }),
  ]);

  const stat = (label: string, v: number) => (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-3xl font-bold">{v}</p>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin overview</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stat("Members", members)}
        {stat("Published profiles", published)}
        {stat("News releases", articles)}
        {stat("Posts syndicated", posted)}
        {stat("Active coupons", coupons)}
      </div>

      {!stripeEnabled() && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <b>Billing is in test mode.</b> Add <code>STRIPE_SECRET_KEY</code> to <code>.env</code> to charge the
          $99 / $299 / $999 plans. Coupons and plans already work; charging turns on automatically.
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Link href="/admin/members" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">Manage members</Link>
        <Link href="/admin/coupons" className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium">Manage coupons</Link>
      </div>
    </div>
  );
}
