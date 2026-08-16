"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(identifier, password);
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-sm px-6 py-20">
      <h1 className="text-2xl font-medium tracking-tight">Sign in</h1>
      <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
        STVDIO° — members only
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-6">
        <label className="block">
          <span className="font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
            Email or username
          </span>
          <input
            type="text"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="you@example.com or username"
            autoComplete="username"
            className="mt-2 w-full border-b border-current/30 bg-transparent py-2 outline-none focus:border-current"
          />
        </label>

        <label className="block">
          <span className="font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
            Password
          </span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-2 w-full border-b border-current/30 bg-transparent py-2 outline-none focus:border-current"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full border border-current px-4 py-3 font-mono text-[0.65rem] uppercase tracking-widest hover:bg-current/5 disabled:opacity-40"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-8 font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
        New here?{" "}
        <Link
          href="/signup"
          className="underline underline-offset-4 hover:opacity-60"
        >
          Create an account
        </Link>
      </p>
    </main>
  );
}
