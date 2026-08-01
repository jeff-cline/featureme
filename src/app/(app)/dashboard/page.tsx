import Link from "next/link";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) return null;
  const profile = user.profile;

  const [articles, syndications, connections, views] = await Promise.all([
    profile ? prisma.article.count({ where: { profileId: profile.id } }) : 0,
    profile
      ? prisma.syndication.count({ where: { article: { profileId: profile.id }, status: "posted" } })
      : 0,
    prisma.connection.count({ where: { userId: user.id, status: "connected" } }),
    profile ? prisma.clickEvent.count({ where: { profileId: profile.id } }) : 0,
  ]);

  const recent = profile
    ? await prisma.article.findMany({
        where: { profileId: profile.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { syndications: true },
      })
    : [];

  const stat = (label: string, value: number | string) => (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome back{user.name ? `, ${user.name}` : ""}</h1>
      <p className="mt-1 text-neutral-600">
        {profile?.published ? (
          <>Your public page is live at <Link className="text-blue-700 underline" href={`/${profile.slug}`}>/{profile.slug}</Link>.</>
        ) : (
          <>Your profile isn’t published yet. <Link className="text-blue-700 underline" href="/profile/edit">Finish it →</Link></>
        )}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stat("News releases", articles)}
        {stat("Posts syndicated", syndications)}
        {stat("Platforms connected", connections)}
        {stat("Profile views", views)}
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/articles/new" className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">+ New news release</Link>
        <Link href="/connections" className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-white">Connect platforms</Link>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Recent news releases</h2>
      <div className="mt-3 space-y-2">
        {recent.length === 0 && <p className="text-sm text-neutral-500">Nothing yet — publish your first release.</p>}
        {recent.map((a) => {
          const posted = a.syndications.filter((s) => s.status === "posted").length;
          return (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3">
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="text-xs text-neutral-500">
                  {a.status} · {posted} platform{posted === 1 ? "" : "s"} posted
                </p>
              </div>
              <Link href="/articles" className="text-sm text-blue-700 hover:underline">Manage →</Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
