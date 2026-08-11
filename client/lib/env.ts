/**
 * Public runtime configuration.
 * Only NEXT_PUBLIC_* values belong here — anything else would be bundled
 * into the browser and exposed. Secrets stay on the server.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";
