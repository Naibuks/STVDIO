"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminTable, { type Column } from "@/components/admin/AdminTable";
import {
  AdminHeading,
  FilterChips,
  Pagination,
  SearchBox,
  StatCard,
} from "@/components/admin/AdminControls";
import * as admin from "@/services/admin";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import type {
  AdminPaginated,
  AdminPaymentsPayload,
  PaymentStatus,
} from "@/types/api";

const STATUSES: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED"];

type Row = AdminPaymentsPayload["payments"][number];

/**
 * /admin/payments — observation only.
 *
 * There is no write endpoint for payments anywhere in the admin API. Marking
 * something paid has to come from Paystack verification, so this screen can
 * show what happened but never change it.
 */
export default function AdminPaymentsPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [meta, setMeta] = useState<AdminPaginated | null>(null);
  const [summary, setSummary] = useState<Record<string, number>>({});
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
          return admin.getPayments({
            page,
            search,
            ...(status ? { paymentStatus: status as PaymentStatus } : {}),
          });
        })
        .then((data) => {
          setRows(data.payments);
          setMeta(data);
          setSummary(data.summary ?? {});
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

  const columns: Column<Row>[] = [
    {
      key: "reference",
      header: "Reference",
      render: (row) => (
        <span className="font-mono text-[0.65rem] text-current/70">
          {row.reference}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (row) => (
        <span className="font-medium">
          {formatMoney(row.amount, row.currency)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={`font-mono text-[0.6rem] uppercase tracking-widest ${
            row.status === "PAID"
              ? "text-emerald-500"
              : row.status === "FAILED"
                ? "text-red-500"
                : "text-current/40"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "user",
      header: "Paid by",
      render: (row) =>
        row.user ? (
          <Link
            href={`/admin/users/${row.user._id}`}
            className="text-current/60 hover:opacity-70"
          >
            @{row.user.username}
          </Link>
        ) : (
          "—"
        ),
    },
    {
      key: "order",
      header: "Order",
      render: (row) =>
        row.order?._id ? (
          <Link
            href={`/admin/orders/${row.order._id}`}
            className="text-current/60 hover:opacity-70"
          >
            {row.order.serviceSnapshot?.title ?? "View"}
          </Link>
        ) : (
          "—"
        ),
    },
    {
      key: "date",
      header: "Date",
      hideOnMobile: true,
      render: (row) => (
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
          {row.paidAt ? formatDate(row.paidAt) : formatDate(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <AdminHeading
        title="Payments"
        subtitle="Observation only — status is set by Paystack verification"
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATUSES.map((s) => (
          <StatCard key={s} label={s} value={summary[s] ?? 0} />
        ))}
      </div>

      <div className="mb-4">
        <SearchBox
          value={input}
          onChange={setInput}
          onSubmit={() => {
            setPage(1);
            setSearch(input.trim());
          }}
          placeholder="Search by reference"
        />
      </div>

      <div className="mb-2">
        <FilterChips
          options={STATUSES.map((s) => ({ value: s, label: s }))}
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
        emptyMessage="No payments match those filters."
      />

      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}
