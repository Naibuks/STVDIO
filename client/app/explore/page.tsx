"use client";

import { useCallback, useEffect, useState } from "react";
import Feed from "@/components/Feed";
import UserCard from "@/components/UserCard";
import { getCreatives } from "@/services/feed";
import type { User } from "@/types/api";

type Tab = "work" | "creatives";

/** /explore — search and discovery across projects and creatives. */
export default function ExplorePage() {
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("work");

  const [creatives, setCreatives] = useState<User[] | null>(null);
  const [creativesError, setCreativesError] = useState<string | null>(null);

  // All state updates live inside the loader rather than the effect body,
  // which is what React's set-state-in-effect rule asks for.
  const loadCreatives = useCallback(
    () =>
      Promise.resolve()
        .then(() => {
          setCreatives(null);
          setCreativesError(null);
          return getCreatives({ search, limit: 24 });
        })
        .then((data) => setCreatives(data.users))
        .catch((err: unknown) =>
          setCreativesError(
            err instanceof Error ? err.message : "Could not load creatives",
          ),
        ),
    [search],
  );

  useEffect(() => {
    if (tab !== "creatives") return;
    loadCreatives();
  }, [tab, loadCreatives]);

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearch(input.trim());
  };

  const tabClass = (active: boolean) =>
    `border-b-2 pb-2 font-mono text-[0.62rem] uppercase tracking-[0.28em] transition ${
      active
        ? "border-[#d66a38] text-[#f5f1ea]"
        : "border-transparent text-[#f5f1ea]/45 hover:text-[#f5f1ea]/75"
    }`;

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-10 text-[#f5f1ea] sm:px-6 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 border-b border-[#1d1d1d] pb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.28em] text-[#f5f1ea]/45">
                Discover
              </p>
              <h1 className="mt-3 text-3xl font-medium tracking-[-0.08em] text-[#f5f1ea] sm:text-4xl">
                Explore
              </h1>
            </div>

            <form onSubmit={onSearch} className="flex w-full max-w-xl items-center gap-3">
              <input
                type="search"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Search work, tags, creatives…"
                aria-label="Search"
                className="flex-1 border-b border-[#2a2a2a] bg-transparent py-2 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#f5f1ea] placeholder:text-[#f5f1ea]/35 outline-none transition focus:border-[#d66a38]"
              />
              <button
                type="submit"
                className="border border-[#2a2a2a] bg-[#111111] px-3 py-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-[#f5f1ea] transition hover:border-[#d66a38] hover:text-[#f5f1ea]"
              >
                Search
              </button>
            </form>
          </div>

          {search && (
            <button
              type="button"
              onClick={() => {
                setInput("");
                setSearch("");
              }}
              className="mt-4 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-[#f5f1ea]/50 underline decoration-[#d66a38]/70 underline-offset-4 transition hover:text-[#f5f1ea]"
            >
              Clear “{search}”
            </button>
          )}
        </header>

        <nav className="mb-8 flex gap-6 border-b border-[#1d1d1d] pb-2">
          <button
            type="button"
            onClick={() => setTab("work")}
            className={tabClass(tab === "work")}
          >
            Work
          </button>
          <button
            type="button"
            onClick={() => setTab("creatives")}
            className={tabClass(tab === "creatives")}
          >
            Creatives to discover
          </button>
        </nav>

        {tab === "work" ? (
          <div className="pt-2">
            <Feed search={search} />
          </div>
        ) : (
          <section className="pt-2">
            {creativesError && (
              <p role="alert" className="py-8 text-sm text-[#d66a38]">
                {creativesError}
              </p>
            )}
            {creatives === null && !creativesError && (
              <p className="py-8 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[#f5f1ea]/40">
                Loading…
              </p>
            )}
            {creatives?.length === 0 && (
              <p className="py-8 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[#f5f1ea]/40">
                No creatives match that search.
              </p>
            )}
            {creatives?.map((user) => (
              <UserCard key={user._id} user={user} />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
