import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import ActionForm from "@/components/ActionForm";
import { createCouponAction, toggleCouponAction } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Coupons" };
const field = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm";

export default async function CouponsPage() {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Coupons</h1>
        <p className="mt-1 text-neutral-600">Create discount codes members can apply at checkout.</p>
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Create coupon</h2>
        <ActionForm action={createCouponAction} submitLabel="Create coupon">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1 block text-sm font-medium">Code</span>
              <input name="code" required className={field} placeholder="FOUNDER50" /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium">Percent off</span>
              <input name="percentOff" type="number" min="1" max="100" className={field} placeholder="25" /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium">— or amount off ($)</span>
              <input name="amountOff" type="number" min="1" className={field} placeholder="50" /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium">Max redemptions (optional)</span>
              <input name="maxRedemptions" type="number" min="1" className={field} placeholder="100" /></label>
          </div>
        </ActionForm>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">All coupons</h2>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Code</th>
                <th className="px-4 py-2 font-medium">Discount</th>
                <th className="px-4 py-2 font-medium">Used</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2 font-mono">{c.code}</td>
                  <td className="px-4 py-2">{c.percentOff ? `${c.percentOff}%` : `$${(c.amountOffCents ?? 0) / 100}`}</td>
                  <td className="px-4 py-2">{c.timesRedeemed}{c.maxRedemptions ? ` / ${c.maxRedemptions}` : ""}</td>
                  <td className="px-4 py-2">{c.active ? <span className="text-green-700">active</span> : <span className="text-neutral-400">off</span>}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={toggleCouponAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="text-sm text-blue-700 hover:underline">{c.active ? "Deactivate" : "Activate"}</button>
                    </form>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-400">No coupons yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
