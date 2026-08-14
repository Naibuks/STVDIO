"use client";

import { useState } from "react";
import Link from "next/link";
import { updateOrderStatus } from "@/services/orders";
import { initializePayment } from "@/services/payments";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import type { Order, OrderStatus, PaymentStatus } from "@/types/api";

/** Tone per status, so the dashboard reads at a glance. */
const STATUS_TONE: Record<OrderStatus, string> = {
  PENDING: "text-[#f5f1ea]/55",
  ACCEPTED: "text-[#f7c1a4]",
  IN_PROGRESS: "text-[#f5f1ea]",
  DELIVERED: "text-[#f5f1ea]",
  COMPLETED: "text-[#d66a38]",
  CANCELLED: "text-[#f5f1ea]/35 line-through",
  DISPUTED: "text-[#f76b5f]",
};

/** Payment state is shown separately from order state — they are independent. */
const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Payment pending",
  PAID: "Payment successful",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
};

const PAYMENT_TONE: Record<PaymentStatus, string> = {
  PENDING: "text-[#f5f1ea]/55",
  PAID: "text-[#d66a38]",
  FAILED: "text-[#f76b5f]",
  REFUNDED: "text-[#f5f1ea]/50",
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
  const [paying, setPaying] = useState(false);

  // Only the buyer pays, only once, and never on a cancelled order.
  const canPay =
    perspective === "client" &&
    order.paymentStatus !== "PAID" &&
    order.status !== "CANCELLED";

  /**
   * Redirect checkout: the server creates the transaction and returns
   * Paystack's authorization URL. Nothing about the amount is decided here,
   * and no Paystack script or key is loaded in the browser.
   */
  const startPayment = async () => {
    setPaying(true);
    setError(null);
    try {
      const { authorizationUrl } = await initializePayment(order._id);
      window.location.href = authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start payment");
      setPaying(false);
    }
  };

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
    <article className="border-b border-[#1d1d1d] py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div className="min-w-0">
          <h3 className="text-[1.35rem] font-medium leading-none tracking-[-0.05em] text-[#f5f1ea]">
            {order.service?._id ? (
              <Link
                href={`/market/${order.service._id}`}
                className="hover:text-[#f7c1a4]"
              >
                {order.serviceSnapshot?.title ?? order.service.title}
              </Link>
            ) : (
              (order.serviceSnapshot?.title ?? "Service")
            )}
          </h3>
          <p className="mt-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-[#f5f1ea]/45">
            {perspective === "client" ? "From" : "For"}{" "}
            <Link
              href={`/profile/${counterparty?.username ?? ""}`}
              className="text-[#f5f1ea]/70 hover:text-[#f5f1ea]"
            >
              {counterparty?.name ?? "Unknown"}
            </Link>
            {" · "}
            {formatDate(order.createdAt)}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xl font-medium tracking-[-0.04em] text-[#f5f1ea]">
            {formatMoney(order.amount, order.currency)}
          </p>
          <p
            className={`mt-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] ${STATUS_TONE[order.status]}`}
          >
            {order.status.replace(/_/g, " ")}
          </p>
          <p
            className={`mt-1 font-mono text-[0.52rem] uppercase tracking-[0.2em] ${PAYMENT_TONE[order.paymentStatus]}`}
          >
            {PAYMENT_LABEL[order.paymentStatus]}
          </p>
        </div>
      </div>

      {order.requirements && (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#f5f1ea]/70">
          {order.requirements}
        </p>
      )}

      {(transitions.length > 0 || canPay) && (
        <div className="mt-5 flex flex-wrap gap-2">
          {canPay && (
            <button
              type="button"
              onClick={startPayment}
              disabled={paying}
              className="border border-[#d66a38] bg-[#d66a38]/10 px-3 py-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-[#f7c1a4] transition hover:bg-[#d66a38]/15 disabled:opacity-40"
            >
              {paying
                ? "Redirecting…"
                : order.paymentStatus === "FAILED"
                  ? "Retry payment"
                  : `Pay ${formatMoney(order.amount, order.currency)}`}
            </button>
          )}
          {transitions.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => move(status)}
              disabled={busy !== null}
              className={`border px-3 py-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] transition disabled:cursor-not-allowed disabled:opacity-40 ${
                status === "CANCELLED" || status === "DISPUTED"
                  ? "border-[#f76b5f]/40 text-[#f76b5f] hover:bg-[#f76b5f]/10"
                  : "border-[#2a2a2a] text-[#f5f1ea] hover:border-[#d66a38]"
              }`}
            >
              {busy === status ? "Working…" : ACTION_LABEL[status]}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-[#f76b5f]">
          {error}
        </p>
      )}
    </article>
  );
}
