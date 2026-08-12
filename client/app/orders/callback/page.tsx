"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { verifyPayment } from "@/services/payments";
import { formatMoney } from "@/lib/money";
import type { Order, Payment } from "@/types/api";

type Result =
  | { kind: "verifying" }
  | { kind: "paid"; payment: Payment; order: Order; alreadyApplied: boolean }
  | { kind: "unsuccessful"; paystackStatus?: string }
  | { kind: "error"; message: string };

/**
 * Where Paystack sends the buyer after checkout.
 *
 * The URL carries only a reference. This page hands that reference to the
 * server, which asks Paystack directly what actually happened — a tampered
 * query string cannot make an order paid.
 */
function PaymentCallback() {
  const params = useSearchParams();
  // Paystack sends both; they hold the same value.
  const reference = params.get("reference") ?? params.get("trxref");

  const [result, setResult] = useState<Result>({ kind: "verifying" });

  const run = useCallback(
    () =>
      Promise.resolve()
        .then(() => {
          if (!reference) {
            throw new Error("No payment reference was returned by Paystack");
          }
          return verifyPayment(reference);
        })
        .then((data) => {
          setResult(
            data.status === "PAID"
              ? {
                  kind: "paid",
                  payment: data.payment,
                  order: data.order,
                  alreadyApplied: data.alreadyApplied,
                }
              : { kind: "unsuccessful", paystackStatus: data.paystackStatus },
          );
        })
        .catch((err: unknown) =>
          setResult({
            kind: "error",
            message:
              err instanceof Error ? err.message : "Could not verify the payment",
          }),
        ),
    [reference],
  );

  useEffect(() => {
    run();
  }, [run]);

  return (
    <main className="mx-auto w-full max-w-md px-6 py-20">
      {result.kind === "verifying" && (
        <>
          <h1 className="text-2xl font-medium tracking-tight">
            Confirming your payment
          </h1>
          <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
            Checking with Paystack — do not close this tab
          </p>
        </>
      )}

      {result.kind === "paid" && (
        <>
          <h1 className="text-2xl font-medium tracking-tight text-emerald-500">
            Payment successful
          </h1>
          <p className="mt-3 text-current/70">
            {formatMoney(result.payment.amount, result.payment.currency)} received
            for {result.order?.serviceSnapshot?.title ?? "your order"}.
          </p>
          <dl className="mt-6 space-y-2 border-t border-current/15 pt-4 font-mono text-[0.6rem] uppercase tracking-widest">
            <div className="flex justify-between gap-4">
              <dt className="text-current/40">Reference</dt>
              <dd className="truncate">{result.payment.reference}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-current/40">Order status</dt>
              <dd>{result.order?.status?.replace(/_/g, " ")}</dd>
            </div>
          </dl>
          {result.alreadyApplied && (
            <p className="mt-4 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
              This payment was already confirmed
            </p>
          )}
        </>
      )}

      {result.kind === "unsuccessful" && (
        <>
          <h1 className="text-2xl font-medium tracking-tight text-red-500">
            Payment failed
          </h1>
          <p className="mt-3 text-current/70">
            Paystack reported the transaction as{" "}
            {result.paystackStatus ?? "unsuccessful"}. Your order has not been
            marked paid — you can try again from your orders.
          </p>
        </>
      )}

      {result.kind === "error" && (
        <>
          <h1 className="text-2xl font-medium tracking-tight">
            Could not confirm
          </h1>
          <p role="alert" className="mt-3 text-sm text-red-500">
            {result.message}
          </p>
        </>
      )}

      <Link
        href="/orders"
        className="mt-10 inline-block border border-current px-4 py-3 font-mono text-[0.65rem] uppercase tracking-widest hover:bg-current/5"
      >
        Back to orders
      </Link>
    </main>
  );
}

export default function PaymentCallbackPage() {
  // useSearchParams needs a Suspense boundary to prerender.
  return (
    <Suspense
      fallback={
        <main className="px-6 py-20 font-mono text-xs uppercase tracking-widest text-current/40">
          Loading…
        </main>
      }
    >
      <PaymentCallback />
    </Suspense>
  );
}
