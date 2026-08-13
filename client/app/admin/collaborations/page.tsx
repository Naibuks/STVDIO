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
import { formatBudget } from "@/components/CollaborationCard";
import * as admin from "@/services/admin";
import { formatCategory, formatDate } from "@/lib/format";
import {
  COLLABORATION_STATUSES,
  type AdminPaginated,
  type Collaboration,
} from "@/types/api";

/**
 * /admin/collaborations — read-only overview.
 *
 * Application contents belong to the person who posted the brief, so this
 * screen shows counts rather than the applications themselves.
 */
export default function AdminCollaborationsPage() {
  const [rows, setRows] = useState<Collaboration[] | null>(null);
  const [meta, setMeta] = useState<AdminPaginated | null>(null);
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      Promise.resolve()
        .then(() => {
          setError(null);
          return admin.getCollaborations({
            page,
            search,
            ...(status ? { status } : {}),
          });
        })
        .then((data) => {
          setRows(data.collaborations);
          setMeta(data);
        })
        .catch((err: unknown) => {
          setRows([]);
          setError(err instanceof Error ? err.message : "Could not load");
        }),
    [page, search, status],
  );

  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<Collaboration>[] = [
    {
      key: "title",
      header: "Brief",
      render: (row) => (
        <Link
          href={`/collaborations/${row._id}`}
          className="font-medium hover:opacity-60"
        >
          {row.title}
        </Link>
      ),
    },
    {
      key: "creator",
      header: "Posted by",
      render: (row) =>
        row.creator ? (
          <Link
            href={`/admin/users/${row.creator._id}`}
            className="text-current/60 hover:opacity-70"
          >
            @{row.creator.username}
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
      key: "budget",
      header: "Budget",
      render: (row) => (
        <span className="text-current/70">{formatBudget(row.budget) || "—"}</span>
      ),
    },
    {
      key: "applications",
      header: "Applications",
      render: (row) => (
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
          {row.applicationsCount}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={`font-mono text-[0.6rem] uppercase tracking-widest ${
            row.status === "OPEN" ? "text-emerald-500" : "text-current/40"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "deadline",
      header: "Deadline",
      hideOnMobile: true,
      render: (row) => (
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
          {row.deadline ? formatDate(row.deadline) : "—"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <AdminHeading
        title="Briefs"
        subtitle="Collaboration opportunities — read-only"
      />

      <div className="mb-4">
        <SearchBox
          value={input}
          onChange={setInput}
          onSubmit={() => {
            setPage(1);
            setSearch(input.trim());
          }}
          placeholder="Search titles and descriptions"
        />
      </div>

      <div className="mb-2">
        <FilterChips
          options={COLLABORATION_STATUSES.map((s) => ({ value: s, label: s }))}
          value={status}
          onChange={(value) => {
            setPage(1);
            setStatus(value);
          }}
          allLabel="Any status"
        />
      </div>

      {error && (
        <p role="alert" className="py-4 text-sm text-red-500">
          {error}
        </p>
      )}

      <AdminTable
        rows={rows}
        columns={columns}
        emptyMessage="No briefs match those filters."
        actions={(row) => (
          <Link
            href={`/collaborations/${row._id}`}
            className="border border-current/30 px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-widest hover:bg-current/5"
          >
            View
          </Link>
        )}
      />

      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}
