"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import CollaborationCard from "@/components/CollaborationCard";
import {
  getMyApplications,
  getMyCollaborations,
} from "@/services/collaborations";
import { formatCategory, formatDate } from "@/lib/format";
import type {
  ApplicationStatus,
  Collaboration,
  CollaborationApplication,
} from "@/types/api";

type Tab = "posted" | "applied";

const STATUS_TONE: Record<ApplicationStatus, string> = {
  PENDING: "text-current/50",
  ACCEPTED: "text-emerald-500",
  REJECTED: "text-current/40",
  WITHDRAWN: "text-current/40",
};

/** /collaborations/mine — what you posted, and what you applied to. */
export default function MyCollaborationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("posted");
  const [posted, setPosted] = useState<Collaboration[] | null>(null);
  const [applied, setApplied] = useState<CollaborationApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (which: Tab) =>
      Promise.resolve()
        .then(() => {
          setError(null);
          if (which === "posted") {
            setPosted(null);
            return getMyCollaborations().then((d) => setPosted(d.collaborations));
          }
          setApplied(null);
          return getMyApplications().then((d) => setApplied(d.applications));
        })
        .catch((err: unknown) =>
          setError(err instanceof Error ? err.message : "Could not load"),
        ),
    [],
  );

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    load(tab);
  }, [loading, user, router, tab, load]);

  if (loading || !user) {
    return (
      <main className="px-6 py-20 font-mono text-xs uppercase tracking-widest text-current/40">
        Loading…
      </main>
    );
  }

  const tabClass = (active: boolean) =>
    `border-b-2 pb-2 font-mono text-[0.65rem] uppercase tracking-widest transition ${
      active
        ? "border-current"
        : "border-transparent text-current/40 hover:text-current/70"
    }`;

  return (
    <main className="px-6 py-12 sm:px-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-medium tracking-tight sm:text-5xl">
            My opportunities
          </h1>
          <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
            Briefs you posted and applications you sent
          </p>
        </div>
        <Link
          href="/collaborations/create"
          className="border border-current px-3 py-2 font-mono text-[0.65rem] uppercase tracking-widest hover:bg-current/5"
        >
          Post a brief
        </Link>
      </header>

      <nav className="mb-8 flex gap-6 border-b border-current/15">
        <button
          type="button"
          onClick={() => setTab("posted")}
          className={tabClass(tab === "posted")}
        >
          Posted
        </button>
        <button
          type="button"
          onClick={() => setTab("applied")}
          className={tabClass(tab === "applied")}
        >
          Applied
        </button>
      </nav>

      {error && (
        <p role="alert" className="py-8 text-sm text-red-500">
          {error}
        </p>
      )}

      {tab === "posted" ? (
        posted === null && !error ? (
          <p className="py-8 font-mono text-xs uppercase tracking-widest text-current/40">
            Loading…
          </p>
        ) : posted?.length === 0 ? (
          <p className="border-t border-current/15 py-12 font-mono text-xs uppercase tracking-widest text-current/40">
            You haven&rsquo;t posted any briefs yet.
          </p>
        ) : (
          <div>
            {posted?.map((collaboration) => (
              <CollaborationCard
                key={collaboration._id}
                collaboration={collaboration}
              />
            ))}
          </div>
        )
      ) : applied === null && !error ? (
        <p className="py-8 font-mono text-xs uppercase tracking-widest text-current/40">
          Loading…
        </p>
      ) : applied?.length === 0 ? (
        <p className="border-t border-current/15 py-12 font-mono text-xs uppercase tracking-widest text-current/40">
          You haven&rsquo;t applied to anything yet.
        </p>
      ) : (
        <div>
          {applied?.map((application) => {
            const parent =
              typeof application.collaboration === "string"
                ? null
                : application.collaboration;
            return (
              <article
                key={application._id}
                className="border-t border-current/15 py-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <h3 className="text-lg font-medium tracking-tight">
                    {parent ? (
                      <Link
                        href={`/collaborations/${parent._id}`}
                        className="hover:opacity-60"
                      >
                        {parent.title}
                      </Link>
                    ) : (
                      "Opportunity removed"
                    )}
                  </h3>
                  <p
                    className={`font-mono text-[0.6rem] uppercase tracking-widest ${STATUS_TONE[application.status]}`}
                  >
                    {application.status}
                  </p>
                </div>

                <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
                  {parent ? formatCategory(parent.category) : "—"}
                  {parent?.location ? ` · ${parent.location}` : ""}
                  {" · Applied "}
                  {formatDate(application.createdAt)}
                </p>

                <p className="mt-2 line-clamp-2 max-w-2xl text-sm text-current/70">
                  {application.message}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
