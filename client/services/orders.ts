import { apiData, json } from "./api";
import type { Order, OrderPayload, OrderStatus, OrdersPayload } from "@/types/api";

export const createOrder = (serviceId: string, requirements?: string) =>
  apiData<{ order: Order }>("/orders", {
    method: "POST",
    body: json({ service: serviceId, requirements }),
  });

/** `role` picks the buyer or seller view; both filter on the caller's own id. */
export const getOrders = (role: "client" | "creative", status?: OrderStatus) => {
  const params = new URLSearchParams({ role });
  if (status) params.set("status", status);
  return apiData<OrdersPayload>(`/orders?${params.toString()}`);
};

export const getOrder = (id: string) =>
  apiData<OrderPayload>(`/orders/${encodeURIComponent(id)}`);

export const updateOrderStatus = (id: string, status: OrderStatus) =>
  apiData<{
    order: Order;
    relation: "client" | "creative" | "admin";
    availableTransitions: OrderStatus[];
  }>(`/orders/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: json({ status }),
  });
