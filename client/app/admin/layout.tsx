"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

/**
 * Admin shell.
 *
 * This guard is a convenience, NOT the security boundary. Every /api/admin
 * route is protected server-side by authenticate + authorizeRoles(ADMIN), so a
 * non-admin who reaches these pages by typing the URL still gets 401/403 from
 * every request the page makes and sees nothing.
 */
const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/creatives", label: "Creatives" },
  { href: "/admin/brands", label: "Brands" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/collaborations", label: "Briefs" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    // Unauthenticated → sign in. Authenticated non-admin stays put and is
    // shown the notice below rather than being bounced somewhere confusing.
    if (!user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <main className="px-6 py-20 font-mono text-xs uppercase tracking-widest text-current/40">
        Loading…
      </main>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <main className="px-6 py-20 sm:px-10">
        <h1 className="text-2xl font-medium tracking-tight">Not authorised</h1>
        <p className="mt-2 max-w-md font-mono text-[0.65rem] uppercase leading-relaxed tracking-widest text-current/50">
          The admin area is restricted to administrators. The API refuses these
          requests regardless of what this page shows.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block border border-current px-4 py-3 font-mono text-[0.65rem] uppercase tracking-widest hover:bg-current/5"
        >
          Back to STVDIO°
        </Link>
      </main>
    );
  }

  return (
    <main className="px-6 py-10 sm:px-10">
      <div className="mb-8 border-b border-current/15 pb-4">
        <p className="font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
          STVDIO° — Administration
        </p>
        <nav className="-mx-1 mt-3 flex gap-4 overflow-x-auto px-1 pb-1">
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 border-b-2 pb-2 font-mono text-[0.65rem] uppercase tracking-widest transition ${
                  active
                    ? "border-current"
                    : "border-transparent text-current/40 hover:text-current/70"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {children}
    </main>
  );
}
