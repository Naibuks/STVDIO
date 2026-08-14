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
    <main className="min-h-screen bg-[#080808] px-4 py-10 text-[#f5f1ea] sm:px-6 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 border-b border-[#1d1d1d] pb-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.28em] text-[#f5f1ea]/55">
                Creative services
              </p>
              <h1 className="mt-3 text-2xl font-medium tracking-[-0.06em] text-[#f5f1ea] sm:text-3xl">
                Marketplace
              </h1>
            </div>

            {user && (
              <div className="flex flex-wrap gap-3 font-mono text-[0.58rem] uppercase tracking-[0.22em]">
                <Link
                  href="/orders"
                  className="border border-[#2a2a2a] bg-[#111111] px-4 py-2.5 transition hover:border-[#d66a38] hover:text-[#f5f1ea]"
                >
                  My orders
                </Link>
                <Link
                  href="/market/new"
                  className="border border-[#d66a38] bg-[#d66a38]/10 px-4 py-2.5 text-[#f7c1a4] transition hover:bg-[#d66a38]/15"
                >
                  Offer a service
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
              placeholder="Search services…"
              aria-label="Search services"
              className="flex-1 border-b border-[#2a2a2a] bg-transparent py-2 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-[#f5f1ea] placeholder:text-[#f5f1ea]/35 outline-none transition focus:border-[#d66a38]"
            />
            <button
              type="submit"
              className="border border-[#2a2a2a] bg-[#111111] px-4 py-2 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[#f5f1ea] transition hover:border-[#d66a38]"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {SORTS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSort(option.value)}
                aria-pressed={sort === option.value}
                className={`border px-2.5 py-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] transition ${
                  sort === option.value
                    ? "border-[#d66a38] bg-[#d66a38]/10 text-[#f7c1a4]"
                    : "border-[#1d1d1d] text-[#f5f1ea]/55 hover:border-[#2a2a2a] hover:text-[#f5f1ea]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8 border-b border-[#1d1d1d] pb-3">
          <CategoryFilter value={category} onChange={setCategory} />
        </div>

        <div className="mb-8 flex items-center justify-between gap-4 border-b border-[#1d1d1d] pb-4">
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-[#f5f1ea]/45">
            {total} {total === 1 ? "service" : "services"}
            {search ? ` matching “${search}”` : ""}
          </p>
        </div>

        {status === "error" && (
          <p role="alert" className="py-8 text-sm text-[#d66a38]">
            {error}
          </p>
        )}

        {status === "loading" && services.length === 0 && (
          <p className="border-t border-[#1d1d1d] py-8 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[#f5f1ea]/40">
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
                  className="border border-[#2a2a2a] bg-[#111111] px-5 py-3 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[#f5f1ea] transition hover:border-[#d66a38] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {status === "loading" ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
