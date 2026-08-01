import { redirect } from "next/navigation";
import ActionForm from "@/components/ActionForm";
import RichEditor from "@/components/RichEditor";
import { createArticleAction } from "@/lib/actions/article";
import { currentUser } from "@/lib/auth";

export const metadata = { title: "New News Release" };
const field = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none";

export default async function NewArticlePage() {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (!user.profile) redirect("/profile/edit");

  return (
    <div>
      <h1 className="text-2xl font-bold">New news release</h1>
      <p className="mt-1 text-neutral-600">
        Write it once. On submit, it fans out to every platform you’ve connected — each citing back to your source.
      </p>

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <ActionForm action={createArticleAction} submitLabel="Save & syndicate">
          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-medium">Title</span>
            <input name="title" required className={field} placeholder="Jeff Cline launches…" />
          </label>

          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-medium">Canonical source URL (what to cite back to)</span>
            <input name="canonicalUrl" className={field} placeholder="https://your-site.com/original-post" />
          </label>

          <div className="mb-2">
            <span className="mb-1 block text-sm font-medium">Body</span>
            <RichEditor name="bodyHtml" placeholder="Write the news release…" />
          </div>

          <label className="mt-4 flex items-center gap-2">
            <input type="checkbox" name="publishNow" defaultChecked />
            <span className="text-sm">Syndicate immediately after saving</span>
          </label>
        </ActionForm>
      </div>
    </div>
  );
}
