"use client";

import { use, useEffect, useState } from "react";
import ProfileView from "@/components/ProfileView";
import { getPortfolio } from "@/services/users";
import type { PortfolioPayload } from "@/types/api";

/**
 * /profile/[username] — a public profile.
 *
 * Next 16 passes `params` as a Promise; `use()` unwraps it in a Client
 * Component. The endpoint decides what is visible: an anonymous viewer gets
 * only PUBLIC work, the owner also gets their private work.
 */
export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const [data, setData] = useState<PortfolioPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPortfolio(username)
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Profile not found"),
      );
  }, [username]);

  if (error) {
    return (
      <main className="px-6 py-20">
        <h1 className="text-2xl font-medium tracking-tight">Not found</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-current/50">
          {error}
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="px-6 py-20 font-mono text-xs uppercase tracking-widest text-current/40">
        Loading…
      </main>
    );
  }

  return (
    <ProfileView
      user={data.owner}
      projects={data.projects}
      isOwner={data.isOwner}
    />
  );
}
