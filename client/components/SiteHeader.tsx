"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function SiteHeader() {
  const { user, loading, signOut } = useAuth();

  return (
    <header className="flex items-baseline justify-between gap-6 border-b border-current/15 px-6 py-4 sm:px-10">
      <Link href="/" className="text-lg font-medium tracking-tight">
        STVDIO<span className="align-super text-[0.5em]">°</span>
      </Link>

      <nav className="flex items-baseline gap-5 font-mono text-[0.65rem] uppercase tracking-widest">
        {loading ? null : user ? (
          <>
            <Link href="/portfolio/new" className="hover:opacity-60">
              New work
            </Link>
            <Link href="/profile" className="hover:opacity-60">
              {user.username}
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="uppercase tracking-widest text-current/50 hover:opacity-60"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link href="/login" className="hover:opacity-60">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
