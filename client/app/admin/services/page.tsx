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
import { formatCategory } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { CATEGORIES, type AdminPaginated, type Category, type Service } from "@/types/api";

/**
 * /admin/services — marketplace moderation.
 *
 * Hide/relist rather than delete: orders reference services, and their
 * serviceSnapshot exists so historical orders survive. There is no admin
 * delete endpoint for services at all.
 */
export default function AdminServicesPage() {
  const [rows, setRows] = useState<Service[] | null>(null);
  const [meta, setMeta] = useState<AdminPaginated | null>(null);
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [active, setActive] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(
    () =>
      Promise.resolve()
        .then(() => {
          setError(null);
          return admin.getServices({
            page,
            search,
            ...(category ? { category: category as Category } : {}),
            ...(active === "" ? {} : { isActive: active === "true" }),
          });
        })
        .then((data) => {
          setRows(data.services);
          setMeta(data);
        })
        .catch((err: unknown) => {
          setRows([]);
          setError(err instanceof Error ? err.message : "Could not load");
        }),
    [page, search, category, active],
  );

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (service: Service) => {
    const next = !service.isActive;
    if (
      !window.confirm(
        next
          ? `Relist "${service.title}" on the marketplace?`
          : `Hide "${service.title}" from the marketplace?\n\nExisting orders are unaffected and the creative can be relisted later.`,
      )
    )
      return;

    setBusy(service._id);
    setError(null);
    try {
      const { service: updated } = await admin.setServiceStatus(
        service._id,
        next,
      );
      setRows((current) =>
        (current ?? []).map((s) => (s._id === updated._id ? updated : s)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update service");
    } finally {
      setBusy(null);
    }
  };

  const columns: Column<Service>[] = [
    {
      key: "title",
      header: "Service",
      render: (row) => (
        <Link href={`/market/${row._id}`} className="font-medium hover:opacity-60">
          {row.title}
        </Link>
      ),
    },
    {
      key: "creator",
      header: "Creator",
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
      key: "price",
      header: "Price",
      render: (row) => (
        <span className="font-medium">
          {formatMoney(row.price, row.currency)}
        </span>
      ),
    },
    {
      key: "orders",
      header: "Orders",
      render: (row) => (
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
          {row.ordersCount}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={`font-mono text-[0.6rem] uppercase tracking-widest ${
            row.isActive ? "text-emerald-500" : "text-current/40"
          }`}
        >
          {row.isActive ? "Listed" : "Hidden"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <AdminHeading title="Services" subtitle="Marketplace listings" />

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

      <div className="mb-2 flex flex-wrap gap-4">
        <FilterChips
          options={CATEGORIES.map((c) => ({ value: c, label: formatCategory(c) }))}
          value={category}
          onChange={(value) => {
            setPage(1);
            setCategory(value);
          }}
          allLabel="All categories"
        />
        <FilterChips
          options={[
            { value: "true", label: "Listed" },
            { value: "false", label: "Hidden" },
          ]}
          value={active}
          onChange={(value) => {
            setPage(1);
            setActive(value);
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
        emptyMessage="No services match those filters."
        actions={(row) => (
          <>
            <Link
              href={`/market/${row._id}`}
              className="border border-current/30 px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-widest hover:bg-current/5"
            >
              View
            </Link>
            <button
              type="button"
              onClick={() => toggle(row)}
              disabled={busy === row._id}
              className={`border px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-widest disabled:opacity-40 ${
                row.isActive
                  ? "border-red-500/40 text-red-500 hover:bg-red-500/10"
                  : "border-current/30 hover:bg-current/5"
              }`}
            >
              {busy === row._id ? "Working…" : row.isActive ? "Hide" : "Relist"}
            </button>
          </>
        )}
      />

      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}
