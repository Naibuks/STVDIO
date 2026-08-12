import { apiData, json } from "./api";
import type { Order, Payment, PaymentStatus } from "@/types/api";

/**
 * Only an order id goes up. Amount, currency, customer email and the Paystack
 * reference are all decided by the server — there is deliberately no way to
 * express them from here.
 */
export const initializePayment = (orderId: string) =>
  apiData<{
    authorizationUrl: string;
    reference: string;
    payment: Payment;
    order: Pick<Order, "_id" | "amount" | "currency" | "paymentStatus">;
  }>("/payments/initialize", { method: "POST", body: json({ orderId }) });

/** The browser knows only the reference; the server asks Paystack the rest. */
export const verifyPayment = (reference: string) =>
  apiData<{
    payment: Payment;
    order: Order;
    status: PaymentStatus;
    paystackStatus?: string;
    alreadyApplied: boolean;
  }>("/payments/verify", { method: "POST", body: json({ reference }) });

export const getPayment = (id: string) =>
  apiData<{ payment: Payment }>(`/payments/${encodeURIComponent(id)}`);

export const getOrderPayments = (orderId: string) =>
  apiData<{ payments: Payment[]; count: number }>(
    `/payments/order/${encodeURIComponent(orderId)}`,
  );
