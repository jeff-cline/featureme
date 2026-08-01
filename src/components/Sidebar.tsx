"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";

export default function Sidebar({
  isAdmin,
  email,
  slug,
}: {
  isAdmin: boolean;
  email: string;
  slug?: string | null;
}) {
  const path = usePathname();
  const link = (href: string, label: string) => {
    const active = path === href || (href !== "/dashboard" && path.startsWith(href));
    return (
      <Link
        href={href}
        className={`block rounded-md px-3 py-2 text-sm ${
          active ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-white p-4">
      <Link href="/" className="mb-6 px-2 text-lg font-bold tracking-tight">FeatureMe</Link>
      <nav className="space-y-1">
        {link("/dashboard", "Dashboard")}
        {link("/profile/edit", "My Profile")}
        {link("/articles", "News Releases")}
        {link("/press", "Press Inbox")}
        {link("/connections", "Connections")}
        {link("/billing", "Billing")}
        {slug && (
          <a
            href={`/${slug}`}
            target="_blank"
            className="block rounded-md px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-100"
          >
            View public page ↗
          </a>
        )}
        {isAdmin && (
          <div className="pt-4">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Admin</p>
            {link("/admin", "Overview")}
            {link("/admin/members", "Members")}
            {link("/admin/coupons", "Coupons")}
            {link("/admin/integrations", "Integrations")}
          </div>
        )}
      </nav>
      <div className="mt-auto space-y-1 border-t border-neutral-200 pt-4">
        <p className="truncate px-3 text-xs text-neutral-400">{email}</p>
        {link("/account/password", "Change password")}
        <form action={logoutAction}>
          <button className="w-full rounded-md px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-100">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
