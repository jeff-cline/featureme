import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import ActionForm from "@/components/ActionForm";
import RichEditor from "@/components/RichEditor";
import {
  saveProfileAction,
  addFaqAction,
  deleteFaqAction,
  addPressLinkAction,
  deletePressLinkAction,
} from "@/lib/actions/profile";

export const dynamic = "force-dynamic";
export const metadata = { title: "My Profile" };

const field = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none";
const labelCls = "mb-1 block text-sm font-medium";

export default async function ProfileEditPage() {
  const user = await currentUser();
  if (!user) return null;

  const profile = user.profile
    ? await prisma.profile.findUnique({
        where: { id: user.profile.id },
        include: { faqs: { orderBy: { order: "asc" } }, pressLinks: { orderBy: { order: "asc" } } },
      })
    : null;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="mt-1 text-neutral-600">
          This is your public, answer-engine-optimized page. Keep it rich and specific.
        </p>
      </div>

      {/* Core profile */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <ActionForm action={saveProfileAction} submitLabel="Save profile">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>Display name</span>
              <input name="displayName" defaultValue={profile?.displayName ?? user.name ?? ""} className={field} required />
            </label>
            <label className="block">
              <span className={labelCls}>Profile URL (featureme.io/…)</span>
              <input name="slug" defaultValue={profile?.slug ?? ""} placeholder="jeff-cline" className={field} required />
            </label>
            <label className="block">
              <span className={labelCls}>Job title</span>
              <input name="jobTitle" defaultValue={profile?.jobTitle ?? ""} className={field} />
            </label>
            <label className="block">
              <span className={labelCls}>Company</span>
              <input name="company" defaultValue={profile?.company ?? ""} className={field} />
            </label>
            <label className="block">
              <span className={labelCls}>Location</span>
              <input name="location" defaultValue={profile?.location ?? ""} className={field} />
            </label>
            <label className="block">
              <span className={labelCls}>Headline (one line)</span>
              <input name="headline" defaultValue={profile?.headline ?? ""} className={field} />
            </label>
            <label className="block">
              <span className={labelCls}>Profile image URL</span>
              <input name="profileImageUrl" defaultValue={profile?.profileImageUrl ?? ""} placeholder="https://…/photo.jpg" className={field} />
            </label>
            <label className="block">
              <span className={labelCls}>YouTube URL (featured video)</span>
              <input name="youtubeUrl" defaultValue={profile?.youtubeUrl ?? ""} placeholder="https://youtube.com/watch?v=…" className={field} />
            </label>
          </div>

          <div className="mt-4">
            <span className={labelCls}>Short bio</span>
            <RichEditor name="bioHtml" initialHTML={profile?.bioHtml ?? ""} />
          </div>
          <div className="mt-4">
            <span className={labelCls}>About (long)</span>
            <RichEditor name="aboutHtml" initialHTML={profile?.aboutHtml ?? ""} />
          </div>

          <hr className="my-6 border-neutral-200" />
          <p className="mb-3 text-sm font-semibold text-neutral-700">Search / Answer-engine settings</p>
          <div className="grid gap-4">
            <label className="block">
              <span className={labelCls}>SEO title</span>
              <input name="seoTitle" defaultValue={profile?.seoTitle ?? ""} className={field} />
            </label>
            <label className="block">
              <span className={labelCls}>SEO description</span>
              <textarea name="seoDescription" defaultValue={profile?.seoDescription ?? ""} rows={2} className={field} />
            </label>
            <label className="block">
              <span className={labelCls}>Keywords (comma-separated — power the homepage link cloud)</span>
              <input name="keywords" defaultValue={profile?.keywords ?? ""} placeholder="Jeff Cline, Medicare expert, insurance" className={field} />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="published" defaultChecked={profile?.published ?? false} />
              <span className="text-sm">Published (visible publicly &amp; in sitemap)</span>
            </label>
          </div>
        </ActionForm>
      </section>

      {/* FAQ */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold">FAQ (rendered as FAQ schema for answer engines)</h2>
        <p className="mt-1 text-sm text-neutral-500">Add the questions people ask about you. These become structured Q&amp;A that LLMs can quote.</p>
        {!profile && <p className="mt-3 text-sm text-amber-700">Save your profile first to add FAQs.</p>}
        {profile && (
          <>
            <div className="mt-4 space-y-2">
              {profile.faqs.map((f) => (
                <div key={f.id} className="flex items-start justify-between rounded-lg border border-neutral-200 px-4 py-3">
                  <div>
                    <p className="font-medium">{f.question}</p>
                    <p className="text-sm text-neutral-600">{f.answer}</p>
                  </div>
                  <form action={deleteFaqAction}>
                    <input type="hidden" name="id" value={f.id} />
                    <button className="text-sm text-red-600 hover:underline">Remove</button>
                  </form>
                </div>
              ))}
            </div>
            <form action={addFaqAction} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input name="question" placeholder="Question" className={field} required />
              <input name="answer" placeholder="Answer" className={field} required />
              <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">Add</button>
            </form>
          </>
        )}
      </section>

      {/* Press links */}
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold">Press &amp; prior citations</h2>
        <p className="mt-1 text-sm text-neutral-500">Link out to articles, releases, and features you’ve had.</p>
        {profile && (
          <>
            <div className="mt-4 space-y-2">
              {profile.pressLinks.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
                  <a href={p.url} target="_blank" className="text-blue-700 hover:underline">
                    {p.title}{p.publisher ? ` — ${p.publisher}` : ""}
                  </a>
                  <form action={deletePressLinkAction}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-sm text-red-600 hover:underline">Remove</button>
                  </form>
                </div>
              ))}
            </div>
            <form action={addPressLinkAction} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <input name="title" placeholder="Title" className={field} required />
              <input name="url" placeholder="https://…" className={field} required />
              <input name="publisher" placeholder="Publisher (optional)" className={field} />
              <button className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white">Add</button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
