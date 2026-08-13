"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminHeading, StatCard } from "@/components/admin/AdminControls";
import { useAuth } from "@/components/AuthProvider";
import * as admin from "@/services/admin";
import { formatCategory, formatDate } from "@/lib/format";
import type { AdminUserDetailPayload } from "@/types/api";

export default function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user: me } = useAuth();

  const [data, setData] = useState<AdminUserDetailPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () =>
      Promise.resolve()
        .then(() => admin.getUser(id))
        .then(setData)
        .catch((err: unknown) =>
          setError(err instanceof Error ? err.message : "User not found"),
        ),
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async () => {
    if (!data) return;
    const next = !data.user.isActive;
    if (
      !window.confirm(
        `${next ? "Reactivate" : "Deactivate"} @${data.user.username}?`,
      )
    )
      return;

    setBusy(true);
    setError(null);
    try {
      const { user } = await admin.setUserStatus(id, next);
      setData((current) => (current ? { ...current, user } : current));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update");
    } finally {
      setBusy(false);
    }
  };

  if (error && !data) {
    return (
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Not found</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-current/50">
          {error}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <p className="py-8 font-mono text-xs uppercase tracking-widest text-current/40">
        Loading…
      </p>
    );
  }

  const { user, activity } = data;
  const row = "flex items-baseline justify-between gap-6 border-b border-current/10 py-3";
  const label = "shrink-0 font-mono text-[0.55rem] uppercase tracking-widest text-current/40";

  return (
    <div>
      <p className="mb-4 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
        <Link href="/admin/users" className="underline underline-offset-4 hover:opacity-60">
          Users
        </Link>
      </p>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminHeading
          title={user.name}
          subtitle={`@${user.username} · ${user.role}`}
        />
        <div className="flex gap-3">
          <Link
            href={`/profile/${user.username}`}
            className="border border-current/30 px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest hover:bg-current/5"
          >
            Public profile
          </Link>
          {/* Self-status changes are rejected by the API, so no control here. */}
          {user._id !== me?._id && (
            <button
              type="button"
              onClick={toggleStatus}
              disabled={busy}
              className={`border px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest disabled:opacity-40 ${
                user.isActive
                  ? "border-red-500/50 text-red-500 hover:bg-red-500/10"
                  : "border-current hover:bg-current/5"
              }`}
            >
              {busy ? "Working…" : user.isActive ? "Deactivate" : "Reactivate"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm text-red-500">
          {error}
        </p>
      )}

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Projects" value={activity.projectCount} />
        <StatCard label="Services" value={activity.serviceCount} />
        <StatCard label="Orders placed" value={activity.ordersPlaced} />
        <StatCard label="Orders received" value={activity.ordersReceived} />
        <StatCard label="Briefs posted" value={activity.collaborationsPosted} />
        <StatCard label="Applications" value={activity.applicationsSent} />
        <StatCard label="Followers" value={activity.followers} />
        <StatCard label="Following" value={activity.following} />
      </div>

      <p className="mb-3 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
        Account
      </p>
      <dl className="border-t border-current/15">
        <div className={row}>
          <dt className={label}>Email</dt>
          <dd className="text-sm">{user.email ?? "—"}</dd>
        </div>
        <div className={row}>
          <dt className={label}>Status</dt>
          <dd
            className={`font-mono text-[0.6rem] uppercase tracking-widest ${
              user.isActive ? "text-emerald-500" : "text-red-500"
            }`}
          >
            {user.isActive ? "Active" : "Deactivated"}
          </dd>
        </div>
        <div className={row}>
          <dt className={label}>Verified</dt>
          <dd className="text-sm">{user.isVerified ? "Yes" : "No"}</dd>
        </div>
        <div className={row}>
          <dt className={label}>Location</dt>
          <dd className="text-sm">{user.location || "—"}</dd>
        </div>
        <div className={row}>
          <dt className={label}>Categories</dt>
          <dd className="text-right text-sm">
            {user.categories?.length
              ? user.categories.map(formatCategory).join(", ")
              : "—"}
          </dd>
        </div>
        <div className={row}>
          <dt className={label}>Skills</dt>
          <dd className="text-right text-sm">
            {user.skills?.length ? user.skills.join(", ") : "—"}
          </dd>
        </div>
        <div className={row}>
          <dt className={label}>Joined</dt>
          <dd className="text-sm">{formatDate(user.createdAt)}</dd>
        </div>
      </dl>

      {user.bio && (
        <>
          <p className="mb-3 mt-8 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
            Bio
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-current/70">
            {user.bio}
          </p>
        </>
      )}
    </div>
  );
}
