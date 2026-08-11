import { apiData } from "./api";
import type { CreativesPayload, FeedPayload, FeedQuery } from "@/types/api";

/** Build a query string, dropping empty values so the API sees clean input. */
const toQuery = (query: FeedQuery = {}) => {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.category) params.set("category", query.category);
  if (query.search?.trim()) params.set("search", query.search.trim());
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

export const getFeed = (query?: FeedQuery) =>
  apiData<FeedPayload>(`/feed${toQuery(query)}`);

export const getCreatives = (query?: FeedQuery) =>
  apiData<CreativesPayload>(`/feed/creatives${toQuery(query)}`);
