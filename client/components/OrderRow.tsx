"use client";

import { useState } from "react";
import Link from "next/link";
import { updateOrderStatus } from "@/services/orders";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import type { Order, OrderStatus } from "@/types/api";

/** Tone per status, so the dashboard reads at a glance. */
const STATUS_TONE: Record<OrderStatus, string> = {
  PENDING: "text-current/50",
  ACCEPTED: "text-current",
  IN_PROGRESS: "text-current",
  DELIVERED: "text-current",
  COMPLETED: "text-emerald-500",
  CANCELLED: "text-current/40 line-through",
  DISPUTED: "text-red-500",
};

/** Verb shown on the button that performs each transition. */
const ACTION_LABEL: Record<OrderStatus, string> = {
  PENDING: "Reopen",
  ACCEPTED: "Accept",
  IN_PROGRESS: "Start work",
  DELIVERED: "Mark delivered",
  COMPLETED: "Approve & complete",
  CANCELLED: "Cancel",
  DISPUTED: "Raise dispute",
};

export default function OrderRow({
  order: initialOrder,
  perspective,
}: {
  order: Order;
  /** Which side of the transaction the viewer is on. */
  perspective: "client" | "creative";
}) {
  const [order, setOrder] = useState(initialOrder);
  const [busy, setBusy] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const counterparty =
    perspective === "client" ? order.creative : order.client;

  const transitions = order.availableTransitions ?? [];

  const move = async (status: OrderStatus) => {
    if (status === "CANCELLED" && !window.confirm("Cancel this order?")) return;

    setBusy(status);
    setError(null);
    try {
      const result = await updateOrderStatus(order._id, status);
      // The server returns the transitions now available from the new status,
      // so the next action appears immediately without a reload.
      setOrder({
        ...order,
        ...result.order,
        availableTransitions: result.availableTransitions,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update");
    } finally {
      setBusy(null);
    }
  };

  return (
    <article className="border-t border-current/15 py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h3 className="text-sm font-medium">
            {order.service?._id ? (
              <Link
                href={`/market/${order.service._id}`}
                className="hover:opacity-60"
              >
                {order.serviceSnapshot?.title ?? order.service.title}
              </Link>
            ) : (
              (order.serviceSnapshot?.title ?? "Service")
            )}
          </h3>
          <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
            {perspective === "client" ? "From" : "For"}{" "}
            <Link
              href={`/profile/${counterparty?.username ?? ""}`}
              className="underline underline-offset-4 hover:opacity-70"
            >
              {counterparty?.name ?? "Unknown"}
            </Link>
            {" · "}
            {formatDate(order.createdAt)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-base font-medium">
            {formatMoney(order.amount, order.currency)}
          </p>
          <p
            className={`mt-1 font-mono text-[0.6rem] uppercase tracking-widest ${STATUS_TONE[order.status]}`}
          >
            {order.status.replace(/_/g, " ")}
          </p>
        </div>
      </div>

      {order.requirements && (
        <p className="mt-3 max-w-2xl text-sm text-current/60">
          {order.requirements}
        </p>
      )}

      {transitions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {transitions.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => move(status)}
              disabled={busy !== null}
              className={`border px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest transition disabled:opacity-40 ${
                status === "CANCELLED" || status === "DISPUTED"
                  ? "border-red-500/40 text-red-500 hover:bg-red-500/10"
                  : "border-current/30 hover:bg-current/5"
              }`}
            >
              {busy === status ? "Working…" : ACTION_LABEL[status]}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-500">
          {error}
        </p>
      )}
    </article>
  );
}
