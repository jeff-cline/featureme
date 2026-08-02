import Link from "next/link";
import { redirect } from "next/navigation";
import ActionForm from "@/components/ActionForm";
import { signupAction } from "@/lib/actions/signup";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = { title: "Get started" };
export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  if (await currentUser()) redirect("/dashboard");
  const { plan } = await searchParams;
  const plans = await prisma.plan.findMany({ orderBy: { priceCents: "asc" } });
  const field = "w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none";

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Link href="/" className="mb-8 text-center text-lg font-bold">FeatureMe</Link>
      <div className="rounded-2xl border border-neutral-200 p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">Create your account</h1>
        <p className="mb-6 text-sm text-neutral-500">Get featured across the web and start earning citations.</p>
        <ActionForm action={signupAction} submitLabel="Create account">
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-medium">Full name</span>
            <input name="name" required className={field} />
          </label>
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-medium">Email</span>
            <input name="email" type="email" required autoComplete="email" className={field} />
          </label>
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-medium">Password</span>
            <input name="password" type="password" required minLength={8} autoComplete="new-password" className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Plan</span>
            <select name="planKey" defaultValue={plan || "basic"} className={field}>
              {plans.map((p) => (
                <option key={p.key} value={p.key}>{p.name} — ${p.priceCents / 100}/mo</option>
              ))}
            </select>
          </label>
        </ActionForm>
        <p className="mt-4 text-center text-sm text-neutral-500">
          Already have an account? <Link href="/login" className="text-blue-700 underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
