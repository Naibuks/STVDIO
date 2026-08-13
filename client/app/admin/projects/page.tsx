"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import {
  AdminHeading,
  FilterChips,
  Pagination,
  SearchBox,
} from "@/components/admin/AdminControls";
import * as admin from "@/services/admin";
import { formatCategory, formatDate } from "@/lib/format";
import { CATEGORIES, type AdminPaginated, type Category, type Project } from "@/types/api";

/** /admin/projects — moderation. Removal cascades likes and comments. */
export default function AdminProjectsPage() {
  const [rows, setRows] = useState<Project[] | null>(null);
  const [meta, setMeta] = useState<AdminPaginated | null>(null);
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(
    () =>
      Promise.resolve()
        .then(() => {
          setError(null);
          return admin.getProjects({
            page,
            search,
            ...(category ? { category: category as Category } : {}),
          });
        })
        .then((data) => {
          setRows(data.projects);
          setMeta(data);
        })
        .catch((err: unknown) => {
          setRows([]);
          setError(err instanceof Error ? err.message : "Could not load");
        }),
    [page, search, category],
  );

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (project: Project) => {
    if (
      !window.confirm(
        `Remove "${project.title}" from the platform?\n\nThis permanently deletes the project along with its likes and comments. It cannot be undone.`,
      )
    )
      return;

    setBusy(project._id);
    setError(null);
    try {
      const result = await admin.deleteProject(project._id);
      setRows((current) => (current ?? []).filter((p) => p._id !== project._id));
      setError(
        `Removed "${project.title}" — ${result.likesRemoved} like(s) and ${result.commentsRemoved} comment(s) also deleted.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove project");
    } finally {
      setBusy(null);
    }
  };

  const columns: Column<Project>[] = [
    {
      key: "title",
      header: "Project",
      render: (row) => (
        <Link href={`/portfolio/${row._id}`} className="font-medium hover:opacity-60">
          {row.title}
        </Link>
      ),
    },
    {
      key: "owner",
      header: "Owner",
      render: (row) =>
        row.owner ? (
          <Link
            href={`/admin/users/${row.owner._id}`}
            className="text-current/60 hover:opacity-70"
          >
            @{row.owner.username}
          </Link>
        ) : (
          "—"
        ),
    },
    {
      key: "category",
      header: "Category",
      render: (row) => (
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/50">
          {formatCategory(row.category)}
        </span>
      ),
    },
    {
      key: "visibility",
      header: "Visibility",
      render: (row) => (
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/50">
          {row.visibility}
        </span>
      ),
    },
    {
      key: "engagement",
      header: "Engagement",
      render: (row) => (
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
          {row.likesCount} likes · {row.commentsCount} comments
        </span>
      ),
    },
    {
      key: "created",
      header: "Created",
      hideOnMobile: true,
      render: (row) => (
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <AdminHeading title="Projects" subtitle="Portfolio moderation" />

      <div className="mb-4">
        <SearchBox
          value={input}
          onChange={setInput}
          onSubmit={() => {
            setPage(1);
            setSearch(input.trim());
          }}
          placeholder="Search titles, descriptions, tags"
        />
      </div>

      <div className="mb-2">
        <FilterChips
          options={CATEGORIES.map((c) => ({
            value: c,
            label: formatCategory(c),
          }))}
          value={category}
          onChange={(value) => {
            setPage(1);
            setCategory(value);
          }}
          allLabel="All categories"
        />
      </div>

      {error && (
        <p role="alert" className="py-4 text-sm text-current/70">
          {error}
        </p>
      )}

      <AdminTable
        rows={rows}
        columns={columns}
        emptyMessage="No projects match those filters."
        actions={(row) => (
          <>
            <Link
              href={`/portfolio/${row._id}`}
              className="border border-current/30 px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-widest hover:bg-current/5"
            >
              View
            </Link>
            <button
              type="button"
              onClick={() => remove(row)}
              disabled={busy === row._id}
              className="border border-red-500/40 px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-widest text-red-500 hover:bg-red-500/10 disabled:opacity-40"
            >
              {busy === row._id ? "Removing…" : "Remove"}
            </button>
          </>
        )}
      />

      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}
