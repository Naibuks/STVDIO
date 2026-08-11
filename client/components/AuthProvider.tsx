"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { clearToken, getToken, setToken } from "@/lib/auth";
import * as usersApi from "@/services/users";
import type { RegisterInput, User } from "@/types/api";

type AuthState = {
  user: User | null;
  /** True until the stored token has been checked against the API. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<User>;
  /** Create an account and sign straight in — /auth/register returns a token. */
  signUp: (input: RegisterInput) => Promise<User>;
  signOut: () => void;
  /** Replace the cached user after a profile edit. */
  setUser: (user: User) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On first load, exchange any stored token for the current user. A token
  // that is expired or belongs to a deleted account is discarded silently.
  //
  // Every setState runs inside a promise callback rather than directly in the
  // effect body, which avoids the cascading re-render React warns about, and
  // `cancelled` stops a late response from writing to an unmounted provider.
  useEffect(() => {
    let cancelled = false;

    Promise.resolve()
      .then(() => (getToken() ? usersApi.getMe() : null))
      .then((result) => {
        if (!cancelled && result) setUser(result.user);
      })
      .catch(() => clearToken())
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { user, token } = await usersApi.login(email, password);
    setToken(token);
    setUser(user);
    return user;
  }, []);

  /**
   * Registration returns the same { user, token } pair as login, so the new
   * account is signed in immediately rather than bouncing through /login.
   */
  const signUp = useCallback(async (input: RegisterInput) => {
    const { user, token } = await usersApi.register(input);
    setToken(token);
    setUser(user);
    return user;
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
