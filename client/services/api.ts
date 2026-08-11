import { API_URL } from "@/lib/env";
import type { ApiError, HealthResponse } from "@/types/api";

/**
 * Thin wrapper around fetch for the STVDIO° REST API.
 * Every request goes through here so auth headers and error shapes only ever
 * need to be handled in one place.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = (data as ApiError | null)?.message ?? response.statusText;
    throw new Error(message);
  }

  return data as T;
}

export const getHealth = () => apiRequest<HealthResponse>("/health");
