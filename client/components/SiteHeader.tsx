"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import MessagesLink from "./MessagesLink";

export default function SiteHeader() {
  const { user, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="overflow-x-hidden border-b border-[#1f1f1f] bg-[#070707] px-4 py-4 text-[#f2efe9] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="min-w-0 text-[1.7rem] font-medium leading-none tracking-[-0.08em]"
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

          <div className="flex items-center gap-1.5 md:hidden">
            {loading ? null : user ? (
              <Link
                href="/profile"
                className="whitespace-nowrap text-[0.56rem] uppercase tracking-[0.2em] text-[#f2efe9]/75"
              >
                Profile
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="whitespace-nowrap border border-[#1f1f1f] bg-[#0d0d0d] px-2.5 py-1.5 text-[0.52rem] uppercase tracking-[0.18em] text-[#f2efe9]/80 transition-colors hover:border-[#b8683d] hover:text-[#f2efe9]"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="whitespace-nowrap border border-[#b8683d] bg-[#b8683d] px-2.5 py-1.5 text-[0.52rem] uppercase tracking-[0.18em] text-[#111111] transition-colors hover:bg-[#c7764d]"
                >
                  Join
                </Link>
              </>
            )}

            <button
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((current) => !current)}
              className="ml-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-[#1f1f1f] bg-[#0d0d0d] text-[#f2efe9] transition-colors hover:border-[#b8683d]"
            >
              <span className="flex flex-col items-center gap-[4px]">
                <span className="block h-px w-4 bg-current" />
                <span className="block h-px w-4 bg-current" />
                <span className="block h-px w-4 bg-current" />
              </span>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="mt-4 border-t border-[#1f1f1f] pt-4 md:hidden">
            <div className="flex flex-col gap-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-[#f2efe9]/70">
              <Link href="/feed" className="py-2 transition-colors hover:text-[#f2efe9]" onClick={() => setMobileOpen(false)}>
                Feed
              </Link>
              <Link href="/explore" className="py-2 transition-colors hover:text-[#f2efe9]" onClick={() => setMobileOpen(false)}>
                Explore
              </Link>
              <Link href="/market" className="py-2 transition-colors hover:text-[#f2efe9]" onClick={() => setMobileOpen(false)}>
                Market
              </Link>
              <Link href="/collaborations" className="py-2 transition-colors hover:text-[#f2efe9]" onClick={() => setMobileOpen(false)}>
                Briefs
              </Link>

              {loading ? null : user ? (
                <>
                  <div onClick={() => setMobileOpen(false)}>
                    <MessagesLink />
                  </div>
                  <Link href="/orders" className="py-2 transition-colors hover:text-[#f2efe9]" onClick={() => setMobileOpen(false)}>
                    Orders
                  </Link>
                  <Link href="/portfolio/new" className="py-2 transition-colors hover:text-[#f2efe9]" onClick={() => setMobileOpen(false)}>
                    New work
                  </Link>
                  <Link href="/profile" className="py-2 transition-colors hover:text-[#f2efe9]" onClick={() => setMobileOpen(false)}>
                    Profile
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link href="/admin" className="py-2 transition-colors hover:text-[#f2efe9]" onClick={() => setMobileOpen(false)}>
                      Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      signOut();
                    }}
                    className="py-2 text-left uppercase tracking-[0.22em] text-[#f2efe9]/50 transition-colors hover:text-[#f2efe9]"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="py-2 transition-colors hover:text-[#f2efe9]" onClick={() => setMobileOpen(false)}>
                    Sign in
                  </Link>
                  <Link href="/signup" className="py-2 transition-colors hover:text-[#f2efe9]" onClick={() => setMobileOpen(false)}>
                    Join
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
