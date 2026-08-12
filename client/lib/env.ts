/**
 * Public runtime configuration.
 * Only NEXT_PUBLIC_* values belong here — anything else would be bundled
 * into the browser and exposed. Secrets stay on the server.
 */

/**
 * Matches the API's own default (server/.env.example PORT=5001).
 *
 * This used to be port 5000, which on macOS is AirPlay Receiver: it answers
 * every request with `403 Forbidden` and an empty body, so a missing
 * NEXT_PUBLIC_API_URL produced pages with no data and no obvious error.
 */
const DEFAULT_API_URL = "http://localhost:5001/api";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;

// NEXT_PUBLIC_* values are inlined at build time, so an unset variable is
// baked in as undefined and cannot be fixed by restarting the browser — only
// by restarting the dev server. Say so loudly rather than failing quietly.
if (!process.env.NEXT_PUBLIC_API_URL && typeof window !== "undefined") {
  console.warn(
    `[STVDIO°] NEXT_PUBLIC_API_URL is not set — using ${DEFAULT_API_URL}. ` +
      "Set it in client/.env.local and restart the dev server.",
  );
}
