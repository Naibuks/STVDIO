"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import OrderRow from "@/components/OrderRow";
import ServiceGrid from "@/components/ServiceGrid";
import { getOrders } from "@/services/orders";
import { getMyServices } from "@/services/marketplace";
import type { Order, Service } from "@/types/api";

type Tab = "buying" | "selling" | "listings";

/**
 * /orders — the marketplace dashboard.
 *
 * One page with three views rather than separate client and creative
 * dashboards: on STVDIO° the same account both hires and gets hired, so
 * splitting them by role would mean a creative needs two dashboards.
 */
export default function OrdersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("buying");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [services, setServices] = useState<Service[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (which: Tab) =>
      Promise.resolve()
        .then(() => {
          setError(null);
          if (which === "listings") {
            setServices(null);
            return getMyServices().then((data) => setServices(data.services));
          }
          setOrders(null);
          return getOrders(which === "selling" ? "creative" : "client").then(
            (data) => setOrders(data.orders),
          );
        })
        .catch((err: unknown) =>
          setError(err instanceof Error ? err.message : "Could not load"),
        ),
    [],
  );

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    load(tab);
  }, [loading, user, router, tab, load]);

  if (loading || !user) {
    return (
      <main className="px-6 py-20 font-mono text-xs uppercase tracking-widest text-current/40">
        Loading…
      </main>
    );
  }

  const tabClass = (active: boolean) =>
    `border-b-2 pb-2 font-mono text-[0.65rem] uppercase tracking-widest transition ${
      active
        ? "border-current"
        : "border-transparent text-current/40 hover:text-current/70"
    }`;

  const emptyState = (message: string, cta?: { href: string; label: string }) => (
    <div className="border-t border-current/15 py-12">
      <p className="font-mono text-xs uppercase tracking-widest text-current/40">
        {message}
      </p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-4 inline-block border border-current px-4 py-2 font-mono text-[0.65rem] uppercase tracking-widest hover:bg-current/5"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );

  return (
    <main className="px-6 py-12 sm:px-10">
      <header className="mb-8">
        <h1 className="text-3xl font-medium tracking-tight sm:text-5xl">
          Orders
        </h1>
        <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
          What you have booked, sold and listed
        </p>
      </header>

      <nav className="mb-8 flex gap-6 border-b border-current/15">
        <button type="button" onClick={() => setTab("buying")} className={tabClass(tab === "buying")}>
          Buying
        </button>
        <button type="button" onClick={() => setTab("selling")} className={tabClass(tab === "selling")}>
          Selling
        </button>
        <button type="button" onClick={() => setTab("listings")} className={tabClass(tab === "listings")}>
          My listings
        </button>
      </nav>

      {error && (
        <p role="alert" className="py-8 text-sm text-red-500">
          {error}
        </p>
      )}

      {tab === "listings" ? (
        services === null && !error ? (
          <p className="py-8 font-mono text-xs uppercase tracking-widest text-current/40">
            Loading…
          </p>
        ) : services?.length === 0 ? (
          emptyState("You haven't listed any services yet.", {
            href: "/market/new",
            label: "Offer a service",
          })
        ) : (
          <ServiceGrid services={services ?? []} />
        )
      ) : orders === null && !error ? (
        <p className="py-8 font-mono text-xs uppercase tracking-widest text-current/40">
          Loading…
        </p>
      ) : orders?.length === 0 ? (
        tab === "buying" ? (
          emptyState("You haven't placed any orders yet.", {
            href: "/market",
            label: "Browse the marketplace",
          })
        ) : (
          emptyState("No one has ordered your services yet.", {
            href: "/market/new",
            label: "Offer a service",
          })
        )
      ) : (
        <div>
          {(orders ?? []).map((order) => (
            <OrderRow
              key={order._id}
              order={order}
              perspective={tab === "selling" ? "creative" : "client"}
            />
          ))}
        </div>
      )}
    </main>
  );
}
