"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function SiteHeader() {
  const { user, loading, signOut } = useAuth();

  return (
    // flex-wrap on both rows: with seven links the nav cannot fit a 375px
    // viewport, and without wrapping it widens the body and makes every page
    // scroll sideways.
    <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3 border-b border-current/15 px-6 py-4 sm:px-10">
      <Link href="/" className="text-lg font-medium tracking-tight">
        STVDIO<span className="align-super text-[0.5em]">°</span>
      </Link>

      <nav className="flex flex-wrap items-baseline gap-x-5 gap-y-2 font-mono text-[0.65rem] uppercase tracking-widest">
        <Link href="/feed" className="hover:opacity-60">
          Feed
        </Link>
        <Link href="/explore" className="hover:opacity-60">
          Explore
        </Link>
        <Link href="/market" className="hover:opacity-60">
          Market
        </Link>
        <Link href="/collaborations" className="hover:opacity-60">
          Briefs
        </Link>
        {loading ? null : user ? (
          <>
            <Link href="/orders" className="hover:opacity-60">
              Orders
            </Link>
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
          <>
            <Link href="/login" className="hover:opacity-60">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="border border-current px-3 py-1.5 hover:bg-current/5"
            >
              Join
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
