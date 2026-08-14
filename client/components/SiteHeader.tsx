"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import MessagesLink from "./MessagesLink";

export default function SiteHeader() {
  const { user, loading, signOut } = useAuth();

  return (
    <header className="border-b border-[#1f1f1f] bg-[#070707] px-4 py-4 text-[#f2efe9] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
        <Link
          href="/"
          className="text-[1.7rem] font-medium leading-none tracking-[-0.08em]"
        >
          STVDIO<span className="align-super text-[0.5em] text-[#b8683d]">°</span>
        </Link>

        <nav className="hidden items-center gap-6 font-mono text-[0.62rem] uppercase tracking-[0.28em] text-[#f2efe9]/70 md:flex">
          <Link href="/feed" className="transition-opacity hover:opacity-70">
            Feed
          </Link>
          <Link href="/explore" className="transition-opacity hover:opacity-70">
            Explore
          </Link>
          <Link href="/market" className="transition-opacity hover:opacity-70">
            Market
          </Link>
          <Link href="/collaborations" className="transition-opacity hover:opacity-70">
            Briefs
          </Link>

          {loading ? null : user ? (
            <>
              <MessagesLink />
              <Link href="/orders" className="transition-opacity hover:opacity-70">
                Orders
              </Link>
              <Link href="/portfolio/new" className="transition-opacity hover:opacity-70">
                New work
              </Link>
              <Link href="/profile" className="transition-opacity hover:opacity-70">
                Profile
              </Link>
              {user.role === "ADMIN" && (
                <Link href="/admin" className="transition-opacity hover:opacity-70">
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={signOut}
                className="uppercase tracking-[0.28em] text-[#f2efe9]/50 transition-opacity hover:opacity-70"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="transition-opacity hover:opacity-70">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="border border-[#b8683d] bg-[#b8683d] px-3 py-2 text-[#111111] transition-colors hover:bg-[#c7764d]"
              >
                Join
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          {loading ? null : user ? (
            <Link href="/profile" className="text-[0.6rem] uppercase tracking-[0.2em] text-[#f2efe9]/75">
              Profile
            </Link>
          ) : (
            <Link
              href="/signup"
              className="border border-[#b8683d] bg-[#b8683d] px-3 py-1.5 text-[0.56rem] uppercase tracking-[0.2em] text-[#111111]"
            >
              Join
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
