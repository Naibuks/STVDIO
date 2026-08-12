"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import SafeImage from "@/components/SafeImage";
import { ApiRequestError } from "@/services/api";
import { deactivateService, getService } from "@/services/marketplace";
import { createOrder } from "@/services/orders";
import { formatCategory, formatDate } from "@/lib/format";
import { formatDelivery, formatMoney } from "@/lib/money";
import type { Service } from "@/types/api";

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [service, setService] = useState<Service | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requirements, setRequirements] = useState("");
  const [ordering, setOrdering] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const load = useCallback(
    () =>
      Promise.resolve()
        .then(() => getService(id))
        .then((data) => {
          setService(data.service);
          setIsOwner(data.isOwner);
        })
        .catch((err: unknown) =>
          setError(err instanceof Error ? err.message : "Service not found"),
        ),
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const onOrder = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setOrdering(true);
    setOrderError(null);
    try {
      await createOrder(id, requirements);
      router.push("/orders");
    } catch (err) {
      setOrderError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not place the order",
      );
      setOrdering(false);
    }
  };

  const onDeactivate = async () => {
    if (
      !window.confirm(
        "Take this service off the marketplace? Existing orders are unaffected, and you can relist it later.",
      )
    )
      return;

    setDeactivating(true);
    try {
      await deactivateService(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not deactivate");
    } finally {
      setDeactivating(false);
    }
  };

  if (error) {
    return (
      <main className="px-6 py-20">
        <h1 className="text-2xl font-medium tracking-tight">Not found</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-current/50">
          {error}
        </p>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="px-6 py-20 font-mono text-xs uppercase tracking-widest text-current/40">
        Loading…
      </main>
    );
  }

  const canOrder = !isOwner && service.isActive;

  return (
    <main className="px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-5xl">
        <p className="font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
          <Link href="/market" className="underline underline-offset-4 hover:opacity-60">
            Marketplace
          </Link>
          {" · "}
          {formatCategory(service.category)}
          {!service.isActive && " · Unlisted"}
        </p>

        <div className="mt-4 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h1 className="text-3xl font-medium tracking-tight sm:text-5xl">
              {service.title}
            </h1>

            <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
              <Link
                href={`/profile/${service.creator.username}`}
                className="underline underline-offset-4 hover:opacity-60"
              >
                {service.creator.name}
              </Link>
              {service.creator.isVerified && " · Verified"}
              {" · "}
              Listed {formatDate(service.createdAt)}
            </p>

            {service.media.length > 0 && (
              <div className="mt-8 space-y-4">
                {service.media.map((item, index) => (
                  <SafeImage
                    key={`${item.url}-${index}`}
                    src={item.url}
                    alt={`${service.title} — image ${index + 1}`}
                    className="w-full bg-current/5 object-cover"
                    fallback={
                      <div className="flex aspect-[4/3] w-full items-center justify-center bg-current/5 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
                        Image unavailable
                      </div>
                    }
                  />
                ))}
              </div>
            )}

            <p className="mt-8 max-w-2xl whitespace-pre-line leading-relaxed text-current/80">
              {service.description}
            </p>

            {service.deliverables.length > 0 && (
              <div className="mt-10 border-t border-current/15 pt-6">
                <h2 className="font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
                  What you get
                </h2>
                <ul className="mt-3 space-y-1 text-sm text-current/80">
                  {service.deliverables.map((item) => (
                    <li key={item}>— {item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Booking panel */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="border border-current/20 p-6">
              <p className="text-3xl font-medium tracking-tight">
                {formatMoney(service.price, service.currency)}
              </p>
              <dl className="mt-4 space-y-2 font-mono text-[0.65rem] uppercase tracking-widest">
                <div className="flex justify-between gap-4">
                  <dt className="text-current/40">Delivery</dt>
                  <dd>{formatDelivery(service.deliveryTime)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-current/40">Booked</dt>
                  <dd>{service.ordersCount}×</dd>
                </div>
              </dl>

              {isOwner ? (
                <div className="mt-6 space-y-3">
                  <Link
                    href={`/market/${service._id}/edit`}
                    className="block border border-current/30 px-4 py-3 text-center font-mono text-[0.65rem] uppercase tracking-widest hover:bg-current/5"
                  >
                    Edit service
                  </Link>
                  {service.isActive ? (
                    <button
                      type="button"
                      onClick={onDeactivate}
                      disabled={deactivating}
                      className="w-full border border-red-500/50 px-4 py-3 font-mono text-[0.65rem] uppercase tracking-widest text-red-500 hover:bg-red-500/10 disabled:opacity-40"
                    >
                      {deactivating ? "Removing…" : "Remove from marketplace"}
                    </button>
                  ) : (
                    <p className="font-mono text-[0.6rem] uppercase leading-relaxed tracking-widest text-current/40">
                      Unlisted. Relist it from the edit page.
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-6">
                  {!service.isActive ? (
                    <p className="font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
                      No longer available
                    </p>
                  ) : (
                    <>
                      <label className="block">
                        <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
                          Brief — optional
                        </span>
                        <textarea
                          value={requirements}
                          onChange={(e) => setRequirements(e.target.value)}
                          rows={3}
                          maxLength={2000}
                          placeholder="What do you need?"
                          className="mt-2 w-full resize-y border-b border-current/30 bg-transparent py-2 text-sm outline-none focus:border-current"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={onOrder}
                        disabled={ordering || !canOrder}
                        className="mt-4 w-full border border-current px-4 py-3 font-mono text-[0.65rem] uppercase tracking-widest hover:bg-current/5 disabled:opacity-40"
                      >
                        {ordering
                          ? "Placing order…"
                          : user
                            ? "Place order"
                            : "Sign in to order"}
                      </button>

                      <p className="mt-3 font-mono text-[0.55rem] uppercase leading-relaxed tracking-widest text-current/30">
                        No payment is taken yet
                      </p>
                    </>
                  )}

                  {orderError && (
                    <p role="alert" className="mt-3 text-sm text-red-500">
                      {orderError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
