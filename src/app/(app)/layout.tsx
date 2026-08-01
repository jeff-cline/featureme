import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { currentUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/account/password");

  return (
    <div className="flex min-h-screen">
      <Sidebar isAdmin={user.role === "ADMIN"} email={user.email} slug={user.profile?.slug} />
      <div className="flex-1 bg-neutral-50">
        <div className="mx-auto max-w-4xl px-8 py-10">{children}</div>
      </div>
    </div>
  );
}
