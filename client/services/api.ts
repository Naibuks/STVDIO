import { API_URL } from "@/lib/env";
import { getToken } from "@/lib/auth";
import type { ApiError, ApiResponse, HealthResponse } from "@/types/api";

/** Thrown for any non-2xx response, carrying the server's field-level errors. */
export class ApiRequestError extends Error {
  status: number;
  errors?: string[];
  /** Per-field messages, present on validation and duplicate-key failures. */
  fields?: Record<string, string>;

  constructor(
    message: string,
    status: number,
    errors?: string[],
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.errors = errors;
    this.fields = fields;
  }
}

/**
 * Thin wrapper around fetch for the STVDIO° REST API.
 * Every request goes through here so the JWT and error shapes are handled in
 * exactly one place.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = data as ApiError | null;
    throw new ApiRequestError(
      error?.message ?? response.statusText,
      response.status,
      error?.errors,
      error?.fields,
    );
  }

  return data as T;
}

/** Unwraps the { success, message, data } envelope down to `data`. */
export async function apiData<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const body = await apiRequest<ApiResponse<T>>(path, options);
  return body.data;
}

export const json = (body: unknown) => JSON.stringify(body);

export const getHealth = () => apiRequest<HealthResponse>("/health");
