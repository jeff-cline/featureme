import Link from "next/link";
import { redirect } from "next/navigation";
import ActionForm from "@/components/ActionForm";
import { loginAction } from "@/lib/actions/auth";
import { currentUser } from "@/lib/auth";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  // Only redirect if the session maps to a REAL user. A stale cookie whose user
  // no longer exists must render the form, not bounce to /dashboard (redirect loop).
  if (await currentUser()) redirect("/dashboard");
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <Link href="/" className="mb-8 text-center text-lg font-bold">FeatureMe</Link>
      <div className="rounded-2xl border border-neutral-200 p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">Member sign in</h1>
        <p className="mb-6 text-sm text-neutral-500">Sign in to manage your profile and news releases.</p>
        <ActionForm action={loginAction} submitLabel="Sign in">
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-medium">Email</span>
            <input name="email" type="email" required autoComplete="email"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Password</span>
            <input name="password" type="password" required autoComplete="current-password"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none" />
          </label>
        </ActionForm>
      </div>
    </main>
  );
}
