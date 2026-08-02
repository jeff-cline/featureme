import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { syndicateAction } from "@/lib/actions/article";

export const dynamic = "force-dynamic";
export const metadata = { title: "Syndication report" };

export default async function ArticleReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.profile) redirect("/profile/edit");

  const article = await prisma.article.findFirst({
    where: { id, profileId: user.profile.id },
    include: { syndications: true },
  });
  if (!article) notFound();

  const targets = await prisma.syndicationTarget.findMany();
  const nameOf = (k: string) => targets.find((t) => t.key === k)?.name ?? k;

  const posted = article.syndications.filter((s) => s.status === "posted");
  const total = article.syndications.length;

  const badge = (status: string) => {
    const map: Record<string, string> = {
      posted: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-700",
      skipped: "bg-neutral-100 text-neutral-500",
      queued: "bg-amber-100 text-amber-700",
    };
    return <span className={`rounded-full px-2 py-0.5 text-xs ${map[status] ?? "bg-neutral-100"}`}>{status}</span>;
  };

  return (
    <div>
      <Link href="/articles" className="text-sm text-neutral-500 hover:underline">← News Releases</Link>
      <h1 className="mt-2 text-2xl font-bold">{article.title}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {article.status} · {new Date(article.createdAt).toLocaleString()}
        {article.canonicalUrl && <> · cites <a href={article.canonicalUrl} target="_blank" className="text-blue-700 underline">source</a></>}
      </p>

      {/* Proof summary */}
      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">Syndication proof</p>
            <p className="text-2xl font-bold">{posted.length} of {total} live</p>
          </div>
          <form action={syndicateAction}>
            <input type="hidden" name="id" value={article.id} />
            <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
              Re-syndicate
            </button>
          </form>
        </div>

        <table className="mt-4 w-full text-sm">
          <thead className="text-left text-neutral-500">
            <tr>
              <th className="py-2 font-medium">Destination</th>
              <th className="py-2 font-medium">Status</th>
              <th className="py-2 font-medium">Live link (proof)</th>
              <th className="py-2 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {article.syndications.map((s) => (
              <tr key={s.id} className="border-t border-neutral-100">
                <td className="py-2.5 font-medium">{nameOf(s.targetKey)}</td>
                <td className="py-2.5">{badge(s.status)}</td>
                <td className="py-2.5">
                  {s.remoteUrl ? (
                    <a href={s.remoteUrl} target="_blank" className="text-blue-700 underline">View ↗</a>
                  ) : s.status === "skipped" ? (
                    <span className="text-neutral-400" title={s.error ?? ""}>not connected</span>
                  ) : s.error ? (
                    <span className="text-red-600" title={s.error}>error</span>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
                <td className="py-2.5 text-neutral-500">
                  {s.postedAt ? new Date(s.postedAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
            {total === 0 && (
              <tr><td colSpan={4} className="py-4 text-center text-neutral-400">Not syndicated yet.</td></tr>
            )}
          </tbody>
        </table>

        <p className="mt-4 text-xs text-neutral-400">
          “not connected” means that platform hasn’t been authorized yet — connect it under{" "}
          <Link href="/connections" className="underline">Connections</Link> and re-syndicate to turn it into a live link.
        </p>
      </div>
    </div>
  );
}
