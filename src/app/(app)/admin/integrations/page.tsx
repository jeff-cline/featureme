import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { INTEGRATIONS, getIntegrationConfig } from "@/lib/integrations";
import ActionForm from "@/components/ActionForm";
import { saveIntegrationAction, testIntegrationAction, syncZapmailAction } from "@/lib/actions/integrations";

export const dynamic = "force-dynamic";
export const metadata = { title: "Integrations" };
const field = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm";

export default async function IntegrationsPage() {
  const user = await currentUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const rows = await prisma.integration.findMany();
  const rowOf = (k: string) => rows.find((r) => r.key === k);
  const configs: Record<string, Record<string, string>> = {};
  for (const def of INTEGRATIONS) configs[def.key] = await getIntegrationConfig(def.key);

  const badge = (status?: string) => {
    const map: Record<string, string> = {
      verified: "bg-green-100 text-green-800",
      saved: "bg-blue-100 text-blue-700",
      failed: "bg-red-100 text-red-700",
      unconfigured: "bg-neutral-100 text-neutral-500",
    };
    const s = status || "unconfigured";
    return <span className={`rounded-full px-2 py-0.5 text-xs ${map[s]}`}>{s}</span>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="mt-1 text-neutral-600">
          Drop API keys in here as you get them. Everything else is already wired — saving a key activates it.
          Keys are stored server-side only.
        </p>
      </div>

      {INTEGRATIONS.map((def) => {
        const row = rowOf(def.key);
        const cfg = configs[def.key];
        return (
          <section key={def.key} className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">{def.label} {badge(row?.status)}</h2>
                <p className="mt-1 text-sm text-neutral-500">{def.blurb}</p>
                {row?.lastError && <p className="mt-1 text-sm text-red-600">Last error: {row.lastError}</p>}
              </div>
              {def.externalUrl && (
                <a href={def.externalUrl} target="_blank" className="text-sm text-blue-700 hover:underline">Get key ↗</a>
              )}
            </div>

            <div className="mt-4">
              <ActionForm action={saveIntegrationAction} submitLabel="Save">
                <input type="hidden" name="__key" value={def.key} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {def.fields.map((f) => (
                    <label key={f.name} className="block">
                      <span className="mb-1 block text-xs font-medium text-neutral-600">{f.label}</span>
                      <input
                        name={f.name}
                        type={f.type === "password" ? "password" : "text"}
                        defaultValue={f.type === "password" && cfg[f.name] ? "" : cfg[f.name] || ""}
                        placeholder={f.type === "password" && cfg[f.name] ? "•••••• (saved — leave blank to keep)" : f.placeholder}
                        className={field}
                      />
                    </label>
                  ))}
                </div>
              </ActionForm>
            </div>

            <div className="mt-3 flex gap-2">
              {def.testable && (
                <form action={testIntegrationAction}>
                  <input type="hidden" name="__key" value={def.key} />
                  <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">Test connection</button>
                </form>
              )}
              {def.key === "zapmail" && (
                <form action={syncZapmailAction}>
                  <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">
                    Sync mailboxes{cfg.mailboxes ? ` (${(JSON.parse(row?.config || "{}").mailboxes || []).length} in pool)` : ""}
                  </button>
                </form>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
