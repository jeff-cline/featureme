import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { connectApiKeyAction, disconnectAction } from "@/lib/actions/connections";

export const dynamic = "force-dynamic";
export const metadata = { title: "Connections" };

const field = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm";

export default async function ConnectionsPage() {
  const user = await currentUser();
  if (!user) return null;

  const [targets, connections] = await Promise.all([
    prisma.syndicationTarget.findMany({ orderBy: { name: "asc" } }),
    prisma.connection.findMany({ where: { userId: user.id } }),
  ]);
  const connOf = (key: string) => connections.find((c) => c.targetKey === key);

  return (
    <div>
      <h1 className="text-2xl font-bold">Connections</h1>
      <p className="mt-1 text-neutral-600">
        Authorize each platform once. After that, your news releases post automatically. The Newsroom is
        always on and needs no setup.
      </p>

      <div className="mt-6 space-y-3">
        {targets.map((t) => {
          const conn = connOf(t.key);
          const connected = conn?.status === "connected";
          return (
            <div key={t.key} className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">
                    {t.name}{" "}
                    <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${connected ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-500"}`}>
                      {t.key === "newsroom" ? "always on" : connected ? "connected" : "not connected"}
                    </span>
                  </p>
                  {t.notes && <p className="mt-1 text-sm text-neutral-500">{t.notes}</p>}
                </div>
                {connected && t.key !== "newsroom" && (
                  <form action={disconnectAction}>
                    <input type="hidden" name="targetKey" value={t.key} />
                    <button className="text-sm text-red-600 hover:underline">Disconnect</button>
                  </form>
                )}
              </div>

              {/* API-key connectors */}
              {(t.key === "devto" || t.key === "hashnode") && !connected && (
                <form action={connectApiKeyAction} className="mt-4 flex flex-wrap items-end gap-2">
                  <input type="hidden" name="targetKey" value={t.key} />
                  <label className="flex-1">
                    <span className="mb-1 block text-xs font-medium text-neutral-600">
                      {t.key === "devto" ? "dev.to API key" : "Hashnode personal access token"}
                    </span>
                    <input name="apiKey" className={field} placeholder="paste key…" />
                  </label>
                  {t.key === "hashnode" && (
                    <label className="flex-1">
                      <span className="mb-1 block text-xs font-medium text-neutral-600">Publication ID</span>
                      <input name="extra" className={field} placeholder="publication id" />
                    </label>
                  )}
                  <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">Connect</button>
                </form>
              )}

              {/* Blogger — real Google OAuth */}
              {t.key === "blogger" && t.enabled && !connected && (
                <a
                  href="/api/connect/blogger/start"
                  className="mt-3 inline-block rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                >
                  Connect Blogger with Google
                </a>
              )}
              {t.key === "blogger" && connected && conn?.meta && (
                <p className="mt-3 text-sm text-green-700">
                  Posting to: {(() => { try { return JSON.parse(conn.meta!).blogName || "your blog"; } catch { return "your blog"; } })()}
                </p>
              )}

              {/* Medium — API retired; guided manual import (auto-sets canonical) */}
              {t.key === "medium" && (
                <p className="mt-3 text-sm text-neutral-500">
                  Medium retired its posting API. To republish: open{" "}
                  <a href="https://medium.com/p/import" target="_blank" className="text-blue-700 underline">medium.com/p/import</a>{" "}
                  and paste your newsroom article URL — Medium auto-applies the canonical back to your source.
                </p>
              )}

              {/* Other OAuth platforms not yet wired */}
              {t.kind === "oauth" && !["blogger", "medium"].includes(t.key) && (
                <p className="mt-3 text-sm text-neutral-500">
                  {t.enabled
                    ? "OAuth connect flow lights up once its app is registered in Integrations."
                    : "Disabled until the platform app is registered."}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
