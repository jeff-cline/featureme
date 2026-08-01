import { redirect } from "next/navigation";
import ActionForm from "@/components/ActionForm";
import { changePasswordAction } from "@/lib/actions/auth";
import { currentUser } from "@/lib/auth";

export const metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <div className="rounded-2xl border border-neutral-200 p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold">
          {user.mustChangePassword ? "Set a new password" : "Change password"}
        </h1>
        <p className="mb-6 text-sm text-neutral-500">
          {user.mustChangePassword
            ? "For security, choose a new password before continuing."
            : "Update the password on your account."}
        </p>
        <ActionForm action={changePasswordAction} submitLabel="Update password">
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-medium">Current password</span>
            <input name="current" type="password" required
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </label>
          <label className="mb-3 block">
            <span className="mb-1 block text-sm font-medium">New password</span>
            <input name="next" type="password" required minLength={8}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Confirm new password</span>
            <input name="confirm" type="password" required minLength={8}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
          </label>
        </ActionForm>
      </div>
    </main>
  );
}
