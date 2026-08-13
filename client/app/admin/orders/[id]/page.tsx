"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminHeading } from "@/components/admin/AdminControls";
import * as admin from "@/services/admin";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import type { AdminOrderDetailPayload } from "@/types/api";

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<AdminOrderDetailPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      Promise.resolve()
        .then(() => admin.getOrder(id))
        .then(setData)
        .catch((err: unknown) =>
          setError(err instanceof Error ? err.message : "Order not found"),
        ),
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Not found</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-current/50">
          {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <p className="py-8 font-mono text-xs uppercase tracking-widest text-current/40">
        Loading…
      </p>
    );
  }

  const { order, payments } = data;
  const row = "flex items-baseline justify-between gap-6 border-b border-current/10 py-3";
  const label = "shrink-0 font-mono text-[0.55rem] uppercase tracking-widest text-current/40";

  return (
    <div>
      <p className="mb-4 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
        <Link href="/admin/orders" className="underline underline-offset-4 hover:opacity-60">
          Orders
        </Link>
      </p>

      <AdminHeading
        title={order.serviceSnapshot?.title ?? "Order"}
        subtitle={`${order.status.replace(/_/g, " ")} · payment ${order.paymentStatus}`}
      />

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <p className="mb-3 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
            Order
          </p>
          <dl className="border-t border-current/15">
            <div className={row}>
              <dt className={label}>Amount</dt>
              <dd className="text-sm font-medium">
                {formatMoney(order.amount, order.currency)}
              </dd>
            </div>
            <div className={row}>
              <dt className={label}>Client</dt>
              <dd className="text-sm">
                {order.client ? (
                  <Link
                    href={`/admin/users/${order.client._id}`}
                    className="hover:opacity-60"
                  >
                    @{order.client.username}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className={row}>
              <dt className={label}>Creative</dt>
              <dd className="text-sm">
                {order.creative ? (
                  <Link
                    href={`/admin/users/${order.creative._id}`}
                    className="hover:opacity-60"
                  >
                    @{order.creative.username}
                  </Link>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div className={row}>
              <dt className={label}>Paystack ref</dt>
              <dd className="min-w-0 truncate text-right font-mono text-[0.6rem] text-current/60">
                {order.paystackReference ?? "—"}
              </dd>
            </div>
            <div className={row}>
              <dt className={label}>Created</dt>
              <dd className="text-sm">{formatDate(order.createdAt)}</dd>
            </div>
            <div className={row}>
              <dt className={label}>Updated</dt>
              <dd className="text-sm">{formatDate(order.updatedAt)}</dd>
            </div>
          </dl>

          {order.requirements && (
            <>
              <p className="mb-3 mt-8 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
                Brief
              </p>
              <p className="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-current/70">
                {order.requirements}
              </p>
            </>
          )}
        </section>

        <section>
          <p className="mb-3 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
            Payment attempts — {payments.length}
          </p>
          {payments.length === 0 ? (
            <p className="border-t border-current/15 py-6 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
              No payment has been attempted
            </p>
          ) : (
            <ul className="border-t border-current/15">
              {payments.map((payment) => (
                <li key={payment._id} className="border-b border-current/10 py-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-medium">
                      {formatMoney(payment.amount, payment.currency)}
                    </span>
                    <span
                      className={`font-mono text-[0.6rem] uppercase tracking-widest ${
                        payment.status === "PAID"
                          ? "text-emerald-500"
                          : payment.status === "FAILED"
                            ? "text-red-500"
                            : "text-current/40"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-mono text-[0.55rem] uppercase tracking-widest text-current/40">
                    {payment.reference}
                  </p>
                  <p className="mt-1 font-mono text-[0.55rem] uppercase tracking-widest text-current/30">
                    {payment.provider} ·{" "}
                    {payment.paidAt
                      ? `paid ${formatDate(payment.paidAt)}`
                      : `created ${formatDate(payment.createdAt)}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 font-mono text-[0.55rem] uppercase leading-relaxed tracking-widest text-current/30">
            Payment status is set only by Paystack verification. There is no
            administrative override.
          </p>
        </section>
      </div>
    </div>
  );
}
