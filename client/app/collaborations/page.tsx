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
    <main className="min-h-screen bg-[#080808] px-4 py-10 text-[#f5f1ea] sm:px-6 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 border-b border-[#1d1d1d] pb-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.28em] text-[#f5f1ea]/55">
                Open calls
              </p>
              <h1 className="mt-3 text-2xl font-medium tracking-[-0.06em] text-[#f5f1ea] sm:text-3xl">
                Briefs
              </h1>
            </div>

            {user && (
              <div className="flex flex-wrap gap-3 font-mono text-[0.58rem] uppercase tracking-[0.22em]">
                <Link
                  href="/collaborations/mine"
                  className="border border-[#2a2a2a] bg-[#111111] px-4 py-2.5 transition hover:border-[#d66a38]"
                >
                  Mine
                </Link>
                <Link
                  href="/collaborations/create"
                  className="border border-[#d66a38] bg-[#d66a38]/10 px-4 py-2.5 text-[#f7c1a4] transition hover:bg-[#d66a38]/15"
                >
                  Post a brief
                </Link>
              </div>
            )}
          </div>
        </header>

        <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <form onSubmit={onSearch} className="flex max-w-2xl flex-1 gap-3">
            <input
              type="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search opportunities…"
              aria-label="Search opportunities"
              className="flex-1 border-b border-[#2a2a2a] bg-transparent py-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[#f5f1ea] placeholder:text-[#f5f1ea]/35 outline-none transition focus:border-[#d66a38]"
            />
            <button
              type="submit"
              className="border border-[#2a2a2a] bg-[#111111] px-4 py-2 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[#f5f1ea] transition hover:border-[#d66a38]"
            >
              Search
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {COLLABORATION_STATUSES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStatus(option)}
                aria-pressed={status === option}
                className={`border px-2.5 py-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] transition ${
                  status === option
                    ? "border-[#d66a38] bg-[#d66a38]/10 text-[#f7c1a4]"
                    : "border-[#1d1d1d] text-[#f5f1ea]/55 hover:border-[#2a2a2a] hover:text-[#f5f1ea]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 border-b border-[#1d1d1d] pb-3">
          <CategoryFilter value={category} onChange={setCategory} />
        </div>

        <div className="mb-8 flex items-center justify-between gap-4 border-b border-[#1d1d1d] pb-4">
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-[#f5f1ea]/45">
            {total} {total === 1 ? "opportunity" : "opportunities"}
            {search ? ` matching “${search}”` : ""}
          </p>
        </div>

        {state === "error" && (
          <p role="alert" className="py-8 text-sm text-[#d66a38]">
            {error}
          </p>
        )}

        {state === "loading" && collaborations.length === 0 && (
          <p className="border-t border-[#1d1d1d] py-8 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[#f5f1ea]/40">
            Loading…
          </p>
        )}

        {state !== "error" && collaborations.length === 0 && state === "ready" && (
          <p className="border-t border-[#1d1d1d] py-8 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[#f5f1ea]/40">
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
              className="border border-[#2a2a2a] bg-[#111111] px-5 py-3 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[#f5f1ea] transition hover:border-[#d66a38] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {state === "loading" ? "Loading…" : "Load more"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
