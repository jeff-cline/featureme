import Link from "next/link";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { syndicateAction } from "@/lib/actions/article";

export const dynamic = "force-dynamic";
export const metadata = { title: "News Releases" };

export default async function ArticlesPage() {
  const user = await currentUser();
  if (!user) return null;
  if (!user.profile) {
    return (
      <div>
        <h1 className="text-2xl font-bold">News Releases</h1>
        <p className="mt-2 text-neutral-600">
          Create your <Link href="/profile/edit" className="text-blue-700 underline">profile</Link> first.
        </p>
      </div>
    );
  }

  const articles = await prisma.article.findMany({
    where: { profileId: user.profile.id },
    orderBy: { createdAt: "desc" },
    include: { syndications: true },
  });

  const targets = await prisma.syndicationTarget.findMany({ where: { enabled: true } });
  const targetName = (k: string) => targets.find((t) => t.key === k)?.name ?? k;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">News Releases</h1>
        <Link href="/articles/new" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">+ New release</Link>
      </div>

      <div className="mt-6 space-y-4">
        {articles.length === 0 && <p className="text-sm text-neutral-500">No releases yet.</p>}
        {articles.map((a) => (
          <div key={a.id} className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <Link href={`/articles/${a.id}`} className="font-semibold hover:underline">{a.title}</Link>
                <p className="text-xs text-neutral-500">
                  {a.status} · {new Date(a.createdAt).toLocaleDateString()}
                  {" · "}
                  <Link href={`/articles/${a.id}`} className="text-blue-700 underline">
                    {a.syndications.filter((s) => s.status === "posted").length} of {a.syndications.length} live — view proof
                  </Link>
                  {a.canonicalUrl && <> · cites <a className="text-blue-700 underline" href={a.canonicalUrl} target="_blank">source</a></>}
                </p>
              </div>
              <form action={syndicateAction}>
                <input type="hidden" name="id" value={a.id} />
                <button className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50">
                  {a.syndications.length ? "Re-syndicate" : "Syndicate now"}
                </button>
              </form>
            </div>
            {a.syndications.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {a.syndications.map((s) => (
                  <span
                    key={s.id}
                    title={s.error ?? s.remoteUrl ?? ""}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      s.status === "posted"
                        ? "bg-green-100 text-green-800"
                        : s.status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {s.remoteUrl ? (
                      <a href={s.remoteUrl} target="_blank" className="underline">{targetName(s.targetKey)}</a>
                    ) : (
                      targetName(s.targetKey)
                    )}
                    {" · "}{s.status}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
