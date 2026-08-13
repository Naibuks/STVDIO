"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { StatCard, AdminHeading } from "@/components/admin/AdminControls";
import { getStats } from "@/services/admin";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/format";
import type { AdminStats } from "@/types/api";

/** /admin — platform overview. Every figure comes from a live count. */
export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      Promise.resolve()
        .then(() => getStats())
        .then(setStats)
        .catch((err: unknown) =>
          setError(
            err instanceof Error ? err.message : "Could not load statistics",
          ),
        ),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <p role="alert" className="py-8 text-sm text-red-500">
        {error}
      </p>
    );
  }

  if (!stats) {
    return (
      <p className="py-8 font-mono text-xs uppercase tracking-widest text-current/40">
        Loading…
      </p>
    );
  }

  const section = "mb-4 font-mono text-[0.6rem] uppercase tracking-widest text-current/40";

  return (
    <div>
      <AdminHeading title="Overview" subtitle="Live platform statistics" />

      <p className={section}>People</p>
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total users" value={stats.users.total} />
        <StatCard label="Creatives" value={stats.users.creatives} />
        <StatCard label="Brands" value={stats.users.brands} />
        <StatCard
          label="Active"
          value={stats.users.active}
          hint={`${stats.users.deactivated} deactivated`}
        />
      </div>

      <p className={section}>Content</p>
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Projects" value={stats.content.projects} />
        <StatCard label="Likes" value={stats.content.likes} />
        <StatCard label="Comments" value={stats.content.comments} />
        <StatCard label="Reviews" value={stats.content.reviews} />
      </div>

      <p className={section}>Marketplace</p>
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Services"
          value={stats.marketplace.services}
          hint={`${stats.marketplace.activeServices} listed`}
        />
        <StatCard label="Orders" value={stats.marketplace.orders} />
        <StatCard
          label="Completed"
          value={stats.marketplace.ordersByStatus.COMPLETED ?? 0}
        />
        <StatCard
          label="Paid"
          value={stats.marketplace.ordersByPaymentStatus.PAID ?? 0}
          hint={`${stats.marketplace.ordersByPaymentStatus.PENDING ?? 0} pending`}
        />
      </div>

      <p className={section}>Payments — confirmed by Paystack only</p>
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Payment records" value={stats.payments.total} />
        {stats.payments.succeededByCurrency.length === 0 ? (
          <StatCard label="Received" value="—" hint="no confirmed payments" />
        ) : (
          stats.payments.succeededByCurrency.map((row) => (
            <StatCard
              key={row.currency}
              label={`Received (${row.currency})`}
              value={formatMoney(row.amount, row.currency)}
              hint={`${row.count} payment${row.count === 1 ? "" : "s"}`}
            />
          ))
        )}
      </div>

      <p className={section}>Community</p>
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Briefs"
          value={stats.collaborations.total}
          hint={`${stats.collaborations.open} open`}
        />
        <StatCard label="Applications" value={stats.collaborations.applications} />
        <StatCard
          label="Conversations"
          value={stats.messaging.conversations}
          hint="aggregate only"
        />
        <StatCard
          label="Messages"
          value={stats.messaging.messages}
          hint="content never exposed"
        />
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <p className={section}>Newest accounts</p>
          <ul className="border-t border-current/15">
            {stats.recent.users.map((user) => (
              <li
                key={user._id}
                className="flex items-baseline justify-between gap-4 border-b border-current/10 py-3"
              >
                <Link
                  href={`/admin/users/${user._id}`}
                  className="text-sm hover:opacity-60"
                >
                  {user.name}{" "}
                  <span className="text-current/40">@{user.username}</span>
                </Link>
                <span className="shrink-0 font-mono text-[0.55rem] uppercase tracking-widest text-current/40">
                  {user.role} · {formatDate(user.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <p className={section}>Latest orders</p>
          <ul className="border-t border-current/15">
            {stats.recent.orders.length === 0 && (
              <li className="py-3 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
                No orders yet
              </li>
            )}
            {stats.recent.orders.map((order) => (
              <li
                key={order._id}
                className="flex items-baseline justify-between gap-4 border-b border-current/10 py-3"
              >
                <Link
                  href={`/admin/orders/${order._id}`}
                  className="min-w-0 truncate text-sm hover:opacity-60"
                >
                  {order.serviceSnapshot?.title ?? "Order"}
                </Link>
                <span className="shrink-0 font-mono text-[0.55rem] uppercase tracking-widest text-current/40">
                  {formatMoney(order.amount, order.currency)} · {order.paymentStatus}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
