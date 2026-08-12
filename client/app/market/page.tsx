"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import CategoryFilter from "@/components/CategoryFilter";
import ServiceGrid from "@/components/ServiceGrid";
import { useAuth } from "@/components/AuthProvider";
import { browseServices } from "@/services/marketplace";
import type { Category, MarketQuery, Service } from "@/types/api";

const SORTS: { value: NonNullable<MarketQuery["sort"]>; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
  { value: "popular", label: "Most booked" },
];

/** /market — the public marketplace. Safe for anonymous visitors. */
export default function MarketPage() {
  const { user } = useAuth();

  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [sort, setSort] = useState<NonNullable<MarketQuery["sort"]>>("newest");

  const [services, setServices] = useState<Service[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (targetPage: number, append: boolean) =>
      // Deferred so no state is written synchronously inside an effect.
      Promise.resolve()
        .then(() => {
          setStatus("loading");
          setError(null);
          return browseServices({
            page: targetPage,
            limit: 12,
            category: category || undefined,
            search,
            sort,
          });
        })
        .then((data) => {
          setServices((current) =>
            append ? [...current, ...data.services] : data.services,
          );
          setPage(data.page);
          setHasMore(data.hasMore);
          setTotal(data.total);
          setStatus("ready");
        })
        .catch((err: unknown) => {
          setError(
            err instanceof Error ? err.message : "Could not load the marketplace",
          );
          setStatus("error");
        }),
    [category, search, sort],
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
            Marketplace
          </h1>
          <p className="mt-2 max-w-md font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
            Hire creatives on STVDIO°
          </p>
        </div>

        {user && (
          <div className="flex gap-3 font-mono text-[0.65rem] uppercase tracking-widest">
            <Link
              href="/orders"
              className="border border-current/30 px-3 py-2 hover:bg-current/5"
            >
              My orders
            </Link>
            <Link
              href="/market/new"
              className="border border-current px-3 py-2 hover:bg-current/5"
            >
              Offer a service
            </Link>
          </div>
        )}
      </header>

      <form onSubmit={onSearch} className="mb-6 flex max-w-xl gap-3">
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search services…"
          aria-label="Search services"
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

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <p className="font-mono text-[0.65rem] uppercase tracking-widest text-current/40">
          {total} {total === 1 ? "service" : "services"}
          {search ? ` matching “${search}”` : ""}
        </p>
        <div className="flex gap-2">
          {SORTS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSort(option.value)}
              aria-pressed={sort === option.value}
              className={`border px-2 py-1 font-mono text-[0.6rem] uppercase tracking-widest transition ${
                sort === option.value
                  ? "border-current bg-current/10"
                  : "border-current/20 text-current/50 hover:border-current/40"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {status === "error" && (
        <p role="alert" className="py-8 text-sm text-red-500">
          {error}
        </p>
      )}

      {status === "loading" && services.length === 0 && (
        <p className="border-t border-current/15 py-8 font-mono text-xs uppercase tracking-widest text-current/40">
          Loading…
        </p>
      )}

      {status !== "error" && (services.length > 0 || status === "ready") && (
        <>
          <ServiceGrid
            services={services}
            emptyMessage={
              search || category
                ? "No services match that search."
                : "No services listed yet."
            }
          />

          {hasMore && (
            <div className="mt-12 flex justify-center">
              <button
                type="button"
                onClick={() => load(page + 1, true)}
                disabled={status === "loading"}
                className="border border-current px-5 py-3 font-mono text-[0.65rem] uppercase tracking-widest hover:bg-current/5 disabled:opacity-40"
              >
                {status === "loading" ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
