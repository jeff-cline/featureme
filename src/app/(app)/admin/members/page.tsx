import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import ActionForm from "@/components/ActionForm";
import { createMemberAction } from "@/lib/actions/admin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Members" };
const field = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm";

export default async function MembersPage() {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const [members, plans] = await Promise.all([
    prisma.user.findMany({
      where: { role: "MEMBER" },
      include: { profile: true, subscription: { include: { plan: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.plan.findMany(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Members</h1>
        <p className="mt-1 text-neutral-600">Create a member account. They get a temp password and are forced to reset it.</p>
      </div>

      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Add member</h2>
        <ActionForm action={createMemberAction} submitLabel="Create member">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className="mb-1 block text-sm font-medium">Name</span>
              <input name="name" className={field} /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium">Email</span>
              <input name="email" type="email" required className={field} /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium">Profile slug (optional)</span>
              <input name="slug" className={field} placeholder="auto from name" /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium">Temp password</span>
              <input name="tempPassword" className={field} placeholder="Welcome!234" /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium">Plan</span>
              <select name="planKey" className={field} defaultValue="basic">
                {plans.map((p) => <option key={p.key} value={p.key}>{p.name} — ${p.priceCents / 100}/mo</option>)}
              </select></label>
          </div>
        </ActionForm>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">All members ({members.length})</h2>
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Page</th>
                <th className="px-4 py-2 font-medium">Plan</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-neutral-100">
                  <td className="px-4 py-2">{m.name || "—"}</td>
                  <td className="px-4 py-2">{m.email}</td>
                  <td className="px-4 py-2">
                    {m.profile ? <a className="text-blue-700 underline" href={`/${m.profile.slug}`} target="_blank">/{m.profile.slug}</a> : "—"}
                  </td>
                  <td className="px-4 py-2">{m.subscription?.plan.name ?? "—"}</td>
                  <td className="px-4 py-2">{m.profile?.published ? "published" : "draft"}</td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-400">No members yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
