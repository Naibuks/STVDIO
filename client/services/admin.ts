import { apiData, json } from "./api";
import type {
  AdminCollaborationsPayload,
  AdminOrderDetailPayload,
  AdminOrdersPayload,
  AdminPaymentsPayload,
  AdminProjectsPayload,
  AdminQuery,
  AdminServicesPayload,
  AdminStats,
  AdminUserDetailPayload,
  AdminUsersPayload,
  Project,
  Service,
  User,
} from "@/types/api";

/** Drops empty values so the API never sees a blank filter. */
const toQuery = (query: AdminQuery = {}) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export const getStats = () => apiData<AdminStats>("/admin/stats");

export const getUsers = (query?: AdminQuery) =>
  apiData<AdminUsersPayload>(`/admin/users${toQuery(query)}`);

export const getCreatives = (query?: AdminQuery) =>
  apiData<AdminUsersPayload>(`/admin/creatives${toQuery(query)}`);

export const getBrands = (query?: AdminQuery) =>
  apiData<AdminUsersPayload>(`/admin/brands${toQuery(query)}`);

export const getUser = (id: string) =>
  apiData<AdminUserDetailPayload>(`/admin/users/${encodeURIComponent(id)}`);

/** The only user field an admin may change. */
export const setUserStatus = (id: string, isActive: boolean) =>
  apiData<{ user: User }>(`/admin/users/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: json({ isActive }),
  });

export const getProjects = (query?: AdminQuery) =>
  apiData<AdminProjectsPayload>(`/admin/projects${toQuery(query)}`);

export const getProject = (id: string) =>
  apiData<{ project: Project }>(`/admin/projects/${encodeURIComponent(id)}`);

export const deleteProject = (id: string) =>
  apiData<{ id: string; likesRemoved: number; commentsRemoved: number }>(
    `/admin/projects/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );

export const getServices = (query?: AdminQuery) =>
  apiData<AdminServicesPayload>(`/admin/services${toQuery(query)}`);

/** Hide or relist. There is deliberately no admin delete for services. */
export const setServiceStatus = (id: string, isActive: boolean) =>
  apiData<{ service: Service }>(
    `/admin/services/${encodeURIComponent(id)}/status`,
    { method: "PATCH", body: json({ isActive }) },
  );

export const getOrders = (query?: AdminQuery) =>
  apiData<AdminOrdersPayload>(`/admin/orders${toQuery(query)}`);

export const getOrder = (id: string) =>
  apiData<AdminOrderDetailPayload>(`/admin/orders/${encodeURIComponent(id)}`);

/** Read-only: payment truth stays with Paystack verification. */
export const getPayments = (query?: AdminQuery) =>
  apiData<AdminPaymentsPayload>(`/admin/payments${toQuery(query)}`);

export const getCollaborations = (query?: AdminQuery) =>
  apiData<AdminCollaborationsPayload>(`/admin/collaborations${toQuery(query)}`);
