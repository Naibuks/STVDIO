"use client";

import { useCallback, useEffect, useState } from "react";
import ProjectGrid from "./ProjectGrid";
import CategoryFilter from "./CategoryFilter";
import { getFeed } from "@/services/feed";
import type { Category, Project } from "@/types/api";

/**
 * The shared feed surface: filter, search results, pagination.
 *
 * Used by both /feed and /explore so the two pages cannot drift apart. The
 * caller supplies the search term; this component owns category, page and the
 * request lifecycle.
 */
export default function Feed({
  search = "",
  showFilter = true,
  limit = 12,
}: {
  search?: string;
  showFilter?: boolean;
  limit?: number;
}) {
  const [category, setCategory] = useState<Category | "">("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  /**
   * `page` is updated here rather than in an effect: changing the filter
   * reloads at page 1 and the page number follows the request that succeeded,
   * which avoids the cascading render React warns about.
   */
  const load = useCallback(
    (targetPage: number, append: boolean) =>
      // The leading Promise.resolve() defers the "loading" flag to a
      // microtask, so no state is written synchronously while an effect is
      // running. Same pattern as AuthProvider.
      Promise.resolve()
        .then(() => {
          setStatus("loading");
          setError(null);
          return getFeed({
            page: targetPage,
            limit,
            category: category || undefined,
            search,
          });
        })
        .then((data) => {
          setProjects((current) =>
            append ? [...current, ...data.projects] : data.projects,
          );
          setPage(data.page);
          setHasMore(data.hasMore);
          setTotal(data.total);
          setStatus("ready");
        })
        .catch((err: unknown) => {
          setError(
            err instanceof Error ? err.message : "Could not load the feed",
          );
          setStatus("error");
        }),
    [category, search, limit],
  );

  // A new filter or search term always restarts from page 1.
  useEffect(() => {
    load(1, false);
  }, [load]);

  const loadMore = () => load(page + 1, true);

  return (
    <div>
      {showFilter && (
        <div className="mb-8">
          <CategoryFilter value={category} onChange={setCategory} />
        </div>
      )}

      {status === "error" && (
        <p role="alert" className="py-8 text-sm text-red-500">
          {error}
        </p>
      )}

      {status === "loading" && projects.length === 0 && (
        <p className="border-t border-current/15 py-8 font-mono text-xs uppercase tracking-widest text-current/40">
          Loading…
        </p>
      )}

      {status !== "error" && (projects.length > 0 || status === "ready") && (
        <>
          <p className="mb-6 font-mono text-[0.65rem] uppercase tracking-widest text-current/40">
            {total} {total === 1 ? "project" : "projects"}
            {search ? ` matching “${search}”` : ""}
          </p>

          <ProjectGrid
            projects={projects}
            interactive
            showDescription
            emptyMessage={
              search
                ? "No projects match that search."
                : "No published work yet."
            }
          />

          {hasMore && (
            <div className="mt-12 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={status === "loading"}
                className="border border-current px-5 py-3 font-mono text-[0.65rem] uppercase tracking-widest hover:bg-current/5 disabled:opacity-40"
              >
                {status === "loading" ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
