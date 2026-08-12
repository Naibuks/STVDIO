import { apiData, json } from "./api";
import type {
  MarketQuery,
  MyServicesPayload,
  ServiceInput,
  ServicePayload,
  ServicesPayload,
} from "@/types/api";

/** Build a query string, dropping empty values so the API sees clean input. */
const toQuery = (query: MarketQuery = {}) => {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.category) params.set("category", query.category);
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.sort) params.set("sort", query.sort);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export const browseServices = (query?: MarketQuery) =>
  apiData<ServicesPayload>(`/services${toQuery(query)}`);

/** The caller's own listings, deactivated ones included. */
export const getMyServices = () =>
  apiData<MyServicesPayload>("/services/mine");

export const getService = (id: string) =>
  apiData<ServicePayload>(`/services/${encodeURIComponent(id)}`);

export const createService = (input: ServiceInput) =>
  apiData<{ service: ServicePayload["service"] }>("/services", {
    method: "POST",
    body: json(input),
  });

export const updateService = (id: string, input: ServiceInput) =>
  apiData<{ service: ServicePayload["service"] }>(
    `/services/${encodeURIComponent(id)}`,
    { method: "PUT", body: json(input) },
  );

/** Takes the listing off the market; it is not destroyed. */
export const deactivateService = (id: string) =>
  apiData<{ service: ServicePayload["service"] }>(
    `/services/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
