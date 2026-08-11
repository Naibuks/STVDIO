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
    `border-b-2 pb-2 font-mono text-[0.65rem] uppercase tracking-widest transition ${
      active
        ? "border-current"
        : "border-transparent text-current/40 hover:text-current/70"
    }`;

  return (
    <main className="px-6 py-12 sm:px-10">
      <header className="mb-8">
        <h1 className="text-3xl font-medium tracking-tight sm:text-5xl">
          Explore
        </h1>
        <p className="mt-2 max-w-md font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
          Discover work and creatives on STVDIO°
        </p>

        <form onSubmit={onSearch} className="mt-8 flex max-w-xl gap-3">
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search work, tags, creatives…"
            aria-label="Search"
            className="flex-1 border-b border-current/30 bg-transparent py-2 outline-none focus:border-current"
          />
          <button
            type="submit"
            className="border border-current px-4 py-2 font-mono text-[0.65rem] uppercase tracking-widest hover:bg-current/5"
          >
            Search
          </button>
        </form>

        {search && (
          <button
            type="button"
            onClick={() => {
              setInput("");
              setSearch("");
            }}
            className="mt-3 font-mono text-[0.6rem] uppercase tracking-widest text-current/40 underline underline-offset-4"
          >
            Clear “{search}”
          </button>
        )}
      </header>

      <nav className="mb-8 flex gap-6 border-b border-current/15">
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
        <Feed search={search} />
      ) : (
        <section>
          {creativesError && (
            <p role="alert" className="py-8 text-sm text-red-500">
              {creativesError}
            </p>
          )}
          {creatives === null && !creativesError && (
            <p className="py-8 font-mono text-xs uppercase tracking-widest text-current/40">
              Loading…
            </p>
          )}
          {creatives?.length === 0 && (
            <p className="py-8 font-mono text-xs uppercase tracking-widest text-current/40">
              No creatives match that search.
            </p>
          )}
          {creatives?.map((user) => (
            <UserCard key={user._id} user={user} />
          ))}
        </section>
      )}
    </main>
  );
}
