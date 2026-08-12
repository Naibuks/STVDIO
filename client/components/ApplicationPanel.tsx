"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import SafeImage from "./SafeImage";
import { getApplications, respondToApplication } from "@/services/collaborations";
import { formatDate } from "@/lib/format";
import type { ApplicationStatus, CollaborationApplication } from "@/types/api";

const STATUS_TONE: Record<ApplicationStatus, string> = {
  PENDING: "text-current/50",
  ACCEPTED: "text-emerald-500",
  REJECTED: "text-current/40",
  WITHDRAWN: "text-current/40",
};

/**
 * Creator-only view of who applied.
 *
 * The server refuses this data to anyone but the creator, so a non-owner who
 * reaches this component still sees nothing — the conditional render is a UX
 * convenience, not the access control.
 */
export default function ApplicationPanel({
  collaborationId,
}: {
  collaborationId: string;
}) {
  const [applications, setApplications] = useState<
    CollaborationApplication[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(
    () =>
      Promise.resolve()
        .then(() => getApplications(collaborationId))
        .then((data) => setApplications(data.applications))
        .catch((err: unknown) =>
          setError(
            err instanceof Error ? err.message : "Could not load applications",
          ),
        ),
    [collaborationId],
  );

  useEffect(() => {
    load();
  }, [load]);

  const respond = async (
    applicationId: string,
    status: "ACCEPTED" | "REJECTED",
  ) => {
    setBusy(applicationId);
    setError(null);
    try {
      const { application } = await respondToApplication(
        collaborationId,
        applicationId,
        status,
      );
      setApplications((current) =>
        (current ?? []).map((a) =>
          a._id === application._id ? { ...a, ...application } : a,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="mt-12 border-t border-current/15 pt-8">
      <h2 className="font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
        Applications{applications ? ` — ${applications.length}` : ""}
      </h2>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-500">
          {error}
        </p>
      )}

      {applications === null && !error && (
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-current/40">
          Loading…
        </p>
      )}

      {applications?.length === 0 && (
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-current/40">
          No one has applied yet.
        </p>
      )}

      <div className="mt-4">
        {applications?.map((application) => (
          <article
            key={application._id}
            className="border-t border-current/10 py-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <Link
                  href={`/profile/${application.applicant.username}`}
                  className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-current/10"
                >
                  <SafeImage
                    src={application.applicant.avatar?.url}
                    alt={application.applicant.name}
                    className="h-full w-full object-cover"
                    fallback={
                      <span className="flex h-full items-center justify-center text-sm font-medium text-current/30">
                        {application.applicant.name.charAt(0)}
                      </span>
                    }
                  />
                </Link>

                <div className="min-w-0">
                  <Link
                    href={`/profile/${application.applicant.username}`}
                    className="text-sm font-medium hover:opacity-60"
                  >
                    {application.applicant.name}
                  </Link>
                  <p className="mt-0.5 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
                    @{application.applicant.username}
                    {application.applicant.location
                      ? ` · ${application.applicant.location}`
                      : ""}
                    {" · "}
                    {formatDate(application.createdAt)}
                  </p>
                </div>
              </div>

              <p
                className={`font-mono text-[0.6rem] uppercase tracking-widest ${STATUS_TONE[application.status]}`}
              >
                {application.status}
              </p>
            </div>

            <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-current/80">
              {application.message}
            </p>

            {application.status === "PENDING" && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => respond(application._id, "ACCEPTED")}
                  disabled={busy !== null}
                  className="border border-current px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest hover:bg-current/5 disabled:opacity-40"
                >
                  {busy === application._id ? "Working…" : "Accept"}
                </button>
                <button
                  type="button"
                  onClick={() => respond(application._id, "REJECTED")}
                  disabled={busy !== null}
                  className="border border-red-500/40 px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest text-red-500 hover:bg-red-500/10 disabled:opacity-40"
                >
                  Reject
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
