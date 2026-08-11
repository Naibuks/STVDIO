"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import UserCard from "./UserCard";
import { getFollowers, getFollowing } from "@/services/follows";
import type { User } from "@/types/api";

/** Shared body of the followers and following pages. */
export default function RelationshipList({
  username,
  mode,
}: {
  username: string;
  mode: "followers" | "following";
}) {
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetcher = mode === "followers" ? getFollowers : getFollowing;

    fetcher(username)
      .then((data) => {
        if (!cancelled) setUsers(data.users);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [username, mode]);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <p className="font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
        <Link
          href={`/profile/${username}`}
          className="underline underline-offset-4 hover:opacity-60"
        >
          @{username}
        </Link>
      </p>
      <h1 className="mt-2 text-3xl font-medium tracking-tight capitalize">
        {mode}
      </h1>

      {error && (
        <p role="alert" className="mt-8 text-sm text-red-500">
          {error}
        </p>
      )}

      {users === null && !error && (
        <p className="mt-8 font-mono text-xs uppercase tracking-widest text-current/40">
          Loading…
        </p>
      )}

      {users?.length === 0 && (
        <p className="mt-8 border-t border-current/15 py-8 font-mono text-xs uppercase tracking-widest text-current/40">
          {mode === "followers"
            ? "No followers yet."
            : "Not following anyone yet."}
        </p>
      )}

      <div className="mt-8">
        {users?.map((user) => (
          <UserCard key={user._id} user={user} />
        ))}
      </div>
    </main>
  );
}
