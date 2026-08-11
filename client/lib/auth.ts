const TOKEN_KEY = "stvdio.token";

/**
 * JWT storage.
 *
 * localStorage is readable by any script on the page, so a successful XSS
 * could steal the token. The safer pattern is an httpOnly cookie set by the
 * server; that changes the Phase 3 auth contract, so it is noted as a known
 * limitation rather than changed unilaterally here.
 *
 * Guarded with `typeof window` because these modules are also evaluated during
 * server rendering, where localStorage does not exist.
 */
export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
};

export const clearToken = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
};
