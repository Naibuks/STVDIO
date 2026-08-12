"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import CategoryFilter from "@/components/CategoryFilter";
import CollaborationCard from "@/components/CollaborationCard";
import { useAuth } from "@/components/AuthProvider";
import { browseCollaborations } from "@/services/collaborations";
import {
  COLLABORATION_STATUSES,
  type Category,
  type Collaboration,
  type CollaborationStatus,
} from "@/types/api";

/** /collaborations — the public opportunity board. */
export default function CollaborationsPage() {
  const { user } = useAuth();

  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [status, setStatus] = useState<CollaborationStatus>("OPEN");

  const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (targetPage: number, append: boolean) =>
      // Deferred so no state is written synchronously inside an effect.
      Promise.resolve()
        .then(() => {
          setState("loading");
          setError(null);
          return browseCollaborations({
            page: targetPage,
            limit: 12,
            category: category || undefined,
            status,
            search,
          });
        })
        .then((data) => {
          setCollaborations((current) =>
            append ? [...current, ...data.collaborations] : data.collaborations,
          );
          setPage(data.page);
          setHasMore(data.hasMore);
          setTotal(data.total);
          setState("ready");
        })
        .catch((err: unknown) => {
          setError(
            err instanceof Error ? err.message : "Could not load opportunities",
          );
          setState("error");
        }),
    [category, status, search],
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  const onSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setSearch(input.trim());
  };

  return (
    <main className="px-6 py-12 sm:px-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-medium tracking-tight sm:text-5xl">
            Opportunities
          </h1>
          <p className="mt-2 max-w-md font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
            Briefs, shoots and commissions from the STVDIO° community
          </p>
        </div>

        {user && (
          <div className="flex gap-3 font-mono text-[0.65rem] uppercase tracking-widest">
            <Link
              href="/collaborations/mine"
              className="border border-current/30 px-3 py-2 hover:bg-current/5"
            >
              Mine
            </Link>
            <Link
              href="/collaborations/create"
              className="border border-current px-3 py-2 hover:bg-current/5"
            >
              Post a brief
            </Link>
          </div>
        )}
      </header>

      <form onSubmit={onSearch} className="mb-6 flex max-w-xl gap-3">
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search opportunities…"
          aria-label="Search opportunities"
          className="flex-1 border-b border-current/30 bg-transparent py-2 outline-none focus:border-current"
        />
        <button
          type="submit"
          className="border border-current px-4 py-2 font-mono text-[0.65rem] uppercase tracking-widest hover:bg-current/5"
        >
          Search
        </button>
      </form>

      <div className="mb-6">
        <CategoryFilter value={category} onChange={setCategory} />
      </div>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <p className="font-mono text-[0.65rem] uppercase tracking-widest text-current/40">
          {total} {total === 1 ? "opportunity" : "opportunities"}
          {search ? ` matching “${search}”` : ""}
        </p>
        <div className="flex gap-2">
          {COLLABORATION_STATUSES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              aria-pressed={status === option}
              className={`border px-2 py-1 font-mono text-[0.6rem] uppercase tracking-widest transition ${
                status === option
                  ? "border-current bg-current/10"
                  : "border-current/20 text-current/50 hover:border-current/40"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {state === "error" && (
        <p role="alert" className="py-8 text-sm text-red-500">
          {error}
        </p>
      )}

      {state === "loading" && collaborations.length === 0 && (
        <p className="border-t border-current/15 py-8 font-mono text-xs uppercase tracking-widest text-current/40">
          Loading…
        </p>
      )}

      {state !== "error" && collaborations.length === 0 && state === "ready" && (
        <p className="border-t border-current/15 py-8 font-mono text-xs uppercase tracking-widest text-current/40">
          {search || category
            ? "Nothing matches that search."
            : `No ${status.toLowerCase()} opportunities right now.`}
        </p>
      )}

      <div>
        {collaborations.map((collaboration) => (
          <CollaborationCard
            key={collaboration._id}
            collaboration={collaboration}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-12 flex justify-center">
          <button
            type="button"
            onClick={() => load(page + 1, true)}
            disabled={state === "loading"}
            className="border border-current px-5 py-3 font-mono text-[0.65rem] uppercase tracking-widest hover:bg-current/5 disabled:opacity-40"
          >
            {state === "loading" ? "Loading…" : "Load more"}
          </button>
        </div>
      )}
    </main>
  );
}
