import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import ActionForm from "@/components/ActionForm";
import { markRespondedAction, createOpportunityAction } from "@/lib/actions/press";

export const dynamic = "force-dynamic";
export const metadata = { title: "Press Inbox" };
const field = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm";

export default async function PressPage() {
  const user = await currentUser();
  if (!user) return null;
  const isAdmin = user.role === "ADMIN";

  const [opps, myResponses] = await Promise.all([
    prisma.pressOpportunity.findMany({ where: { active: true }, orderBy: { createdAt: "desc" } }),
    prisma.pressResponse.findMany({ where: { userId: user.id }, select: { opportunityId: true } }),
  ]);
  const responded = new Set(myResponses.map((r) => r.opportunityId));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Press Inbox</h1>
        <p className="mt-1 text-neutral-600">
          Journalist and earned-media queries in your field. Answering these earns the highest-authority,
          free citations available. Respond on the source platform, then mark it here.
        </p>
      </div>

      {isAdmin && (
        <section className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold">Add opportunity</h2>
          <ActionForm action={createOpportunityAction} submitLabel="Add opportunity">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium text-neutral-600">Title</span>
                <input name="title" required className={field} /></label>
              <label className="block"><span className="mb-1 block text-xs font-medium text-neutral-600">Outlet</span>
                <input name="outlet" className={field} /></label>
              <label className="block"><span className="mb-1 block text-xs font-medium text-neutral-600">Category</span>
                <input name="category" className={field} placeholder="Startups / Insurance / AI…" /></label>
              <label className="block"><span className="mb-1 block text-xs font-medium text-neutral-600">Source</span>
                <select name="source" className={field} defaultValue="manual">
                  <option value="manual">Manual</option>
                  <option value="featured">Featured</option>
                  <option value="qwoted">Qwoted</option>
                  <option value="helpab2b">Help a B2B Writer</option>
                  <option value="rss">RSS</option>
                </select></label>
              <label className="block"><span className="mb-1 block text-xs font-medium text-neutral-600">Deadline</span>
                <input name="deadline" type="date" className={field} /></label>
              <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium text-neutral-600">Respond URL</span>
                <input name="url" className={field} placeholder="https://…" /></label>
              <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium text-neutral-600">Query / what they want</span>
                <textarea name="query" rows={2} className={field} /></label>
            </div>
          </ActionForm>
        </section>
      )}

      <section className="space-y-3">
        {opps.length === 0 && <p className="text-sm text-neutral-500">No open opportunities right now.</p>}
        {opps.map((o) => (
          <div key={o.id} className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{o.title}</p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {[o.outlet, o.category, o.source].filter(Boolean).join(" · ")}
                  {o.deadline && <> · due {new Date(o.deadline).toLocaleDateString()}</>}
                </p>
                {o.query && <p className="mt-2 text-sm text-neutral-700">{o.query}</p>}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                {o.url && (
                  <a href={o.url} target="_blank" className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800">Respond ↗</a>
                )}
                {responded.has(o.id) ? (
                  <span className="text-xs text-green-700">✓ marked responded</span>
                ) : (
                  <form action={markRespondedAction}>
                    <input type="hidden" name="opportunityId" value={o.id} />
                    <button className="text-xs text-blue-700 hover:underline">Mark responded</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
