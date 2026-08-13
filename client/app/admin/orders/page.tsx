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
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import {
  ORDER_STATUSES,
  type AdminPaginated,
  type Order,
  type PaymentStatus,
} from "@/types/api";

const PAYMENT_STATUSES: PaymentStatus[] = [
  "PENDING",
  "PAID",
  "FAILED",
  "REFUNDED",
];

/**
 * /admin/orders — read-only.
 *
 * Deliberately no controls to change an order's status or payment status:
 * order progress belongs to the two parties (Phase 6) and payment truth to
 * Paystack verification (Phase 7). An admin observes both.
 */
export default function AdminOrdersPage() {
  const [rows, setRows] = useState<Order[] | null>(null);
  const [meta, setMeta] = useState<AdminPaginated | null>(null);
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      Promise.resolve()
        .then(() => {
          setError(null);
          return admin.getOrders({
            page,
            search,
            ...(status ? { status } : {}),
            ...(paymentStatus
              ? { paymentStatus: paymentStatus as PaymentStatus }
              : {}),
          });
        })
        .then((data) => {
          setRows(data.orders);
          setMeta(data);
        })
        .catch((err: unknown) => {
          setRows([]);
          setError(err instanceof Error ? err.message : "Could not load");
        }),
    [page, search, status, paymentStatus],
  );

  useEffect(() => {
    load();
  }, [load]);

  const columns: Column<Order>[] = [
    {
      key: "service",
      header: "Service",
      render: (row) => (
        <Link href={`/admin/orders/${row._id}`} className="font-medium hover:opacity-60">
          {row.serviceSnapshot?.title ?? "Order"}
        </Link>
      ),
    },
    {
      key: "client",
      header: "Client",
      render: (row) =>
        row.client ? (
          <Link
            href={`/admin/users/${row.client._id}`}
            className="text-current/60 hover:opacity-70"
          >
            @{row.client.username}
          </Link>
        ) : (
          "—"
        ),
    },
    {
      key: "creative",
      header: "Creative",
      render: (row) =>
        row.creative ? (
          <Link
            href={`/admin/users/${row.creative._id}`}
            className="text-current/60 hover:opacity-70"
          >
            @{row.creative.username}
          </Link>
        ) : (
          "—"
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
      header: "Order",
      render: (row) => (
        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/50">
          {row.status.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "payment",
      header: "Payment",
      render: (row) => (
        <span
          className={`font-mono text-[0.6rem] uppercase tracking-widest ${
            row.paymentStatus === "PAID"
              ? "text-emerald-500"
              : row.paymentStatus === "FAILED"
                ? "text-red-500"
                : "text-current/40"
          }`}
        >
          {row.paymentStatus}
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
      <AdminHeading
        title="Orders"
        subtitle="Read-only — payment state comes from Paystack verification"
      />

      <div className="mb-4">
        <SearchBox
          value={input}
          onChange={setInput}
          onSubmit={() => {
            setPage(1);
            setSearch(input.trim());
          }}
          placeholder="Search service title or Paystack reference"
        />
      </div>

      <div className="mb-2 flex flex-wrap gap-4">
        <FilterChips
          options={ORDER_STATUSES.map((s) => ({
            value: s,
            label: s.replace(/_/g, " "),
          }))}
          value={status}
          onChange={(value) => {
            setPage(1);
            setStatus(value);
          }}
          allLabel="Any order status"
        />
        <FilterChips
          options={PAYMENT_STATUSES.map((s) => ({ value: s, label: s }))}
          value={paymentStatus}
          onChange={(value) => {
            setPage(1);
            setPaymentStatus(value);
          }}
          allLabel="Any payment"
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
        emptyMessage="No orders match those filters."
        actions={(row) => (
          <Link
            href={`/admin/orders/${row._id}`}
            className="border border-current/30 px-3 py-1.5 font-mono text-[0.55rem] uppercase tracking-widest hover:bg-current/5"
          >
            Detail
          </Link>
        )}
      />

      <Pagination meta={meta} onPage={setPage} />
    </div>
  );
}
