"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ApplicationPanel from "@/components/ApplicationPanel";
import { formatBudget } from "@/components/CollaborationCard";
import { ApiRequestError } from "@/services/api";
import {
  applyToCollaboration,
  deleteCollaboration,
  getCollaboration,
} from "@/services/collaborations";
import { formatCategory, formatDate } from "@/lib/format";
import type { Collaboration, MyApplication } from "@/types/api";

export default function CollaborationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [collaboration, setCollaboration] = useState<Collaboration | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [myApplication, setMyApplication] = useState<MyApplication | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    () =>
      Promise.resolve()
        .then(() => getCollaboration(id))
        .then((data) => {
          setCollaboration(data.collaboration);
          setIsOwner(data.isOwner);
          setMyApplication(data.myApplication);
        })
        .catch((err: unknown) =>
          setError(
            err instanceof Error ? err.message : "Collaboration not found",
          ),
        ),
    [id],
  );

  useEffect(() => {
    load();
  }, [load]);

  const onApply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    setApplying(true);
    setApplyError(null);
    try {
      await applyToCollaboration(id, message);
      setMessage("");
      await load();
    } catch (err) {
      setApplyError(
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not apply",
      );
    } finally {
      setApplying(false);
    }
  };

  const onDelete = async () => {
    if (
      !window.confirm(
        "Delete this opportunity? Its applications are removed too and this cannot be undone.",
      )
    )
      return;
    setDeleting(true);
    try {
      await deleteCollaboration(id);
      router.push("/collaborations");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
      setDeleting(false);
    }
  };

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

  if (!collaboration) {
    return (
      <main className="px-6 py-20 font-mono text-xs uppercase tracking-widest text-current/40">
        Loading…
      </main>
    );
  }

  const open = collaboration.status === "OPEN";
  const budget = formatBudget(collaboration.budget);

  return (
    <main className="px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
          <Link
            href="/collaborations"
            className="underline underline-offset-4 hover:opacity-60"
          >
            Opportunities
          </Link>
          {" · "}
          {formatCategory(collaboration.category)}
          {!open && ` · ${collaboration.status}`}
        </p>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
          <h1 className="max-w-2xl text-3xl font-medium tracking-tight sm:text-5xl">
            {collaboration.title}
          </h1>

          {isOwner && (
            <div className="flex gap-3 font-mono text-[0.65rem] uppercase tracking-widest">
              <Link
                href={`/collaborations/${collaboration._id}/edit`}
                className="border border-current/30 px-3 py-2 hover:bg-current/5"
              >
                Edit
              </Link>
              <button
                type="button"
                onClick={onDelete}
                disabled={deleting}
                className="border border-red-500/50 px-3 py-2 text-red-500 hover:bg-red-500/10 disabled:opacity-40"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          )}
        </div>

        <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
          <Link
            href={`/profile/${collaboration.creator.username}`}
            className="underline underline-offset-4 hover:opacity-60"
          >
            {collaboration.creator.name}
          </Link>
          {" · Posted "}
          {formatDate(collaboration.createdAt)}
        </p>

        <dl className="mt-8 grid gap-6 border-y border-current/15 py-6 font-mono text-[0.65rem] uppercase tracking-widest sm:grid-cols-4">
          <div>
            <dt className="text-current/40">Discipline</dt>
            <dd className="mt-1 normal-case tracking-normal">
              {formatCategory(collaboration.category)}
            </dd>
          </div>
          <div>
            <dt className="text-current/40">Location</dt>
            <dd className="mt-1 normal-case tracking-normal">
              {collaboration.location || "—"}
              {collaboration.isRemote ? " (remote ok)" : ""}
            </dd>
          </div>
          <div>
            <dt className="text-current/40">Budget</dt>
            <dd className="mt-1 normal-case tracking-normal">{budget || "—"}</dd>
          </div>
          <div>
            <dt className="text-current/40">Deadline</dt>
            <dd className="mt-1 normal-case tracking-normal">
              {collaboration.deadline
                ? formatDate(collaboration.deadline)
                : "—"}
            </dd>
          </div>
        </dl>

        <p className="mt-8 max-w-2xl whitespace-pre-line leading-relaxed text-current/80">
          {collaboration.description}
        </p>

        {/* Creator view: manage applications. Non-owners never render this. */}
        {isOwner ? (
          <ApplicationPanel collaborationId={collaboration._id} />
        ) : (
          <section className="mt-12 border-t border-current/15 pt-8">
            <h2 className="font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
              Apply
            </h2>

            {myApplication ? (
              <div className="mt-5 border border-current/20 p-5">
                <p className="font-mono text-[0.6rem] uppercase tracking-widest text-current/50">
                  Your application — {myApplication.status}
                </p>
                <p className="mt-3 whitespace-pre-line text-sm text-current/80">
                  {myApplication.message}
                </p>
                <p className="mt-3 font-mono text-[0.55rem] uppercase tracking-widest text-current/30">
                  Sent {formatDate(myApplication.createdAt)}
                </p>
              </div>
            ) : !open ? (
              <p className="mt-5 font-mono text-[0.65rem] uppercase tracking-widest text-current/40">
                This opportunity is {collaboration.status.toLowerCase()} and is
                no longer accepting applications.
              </p>
            ) : !user ? (
              <p className="mt-5 font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
                <Link href="/login" className="underline underline-offset-4">
                  Sign in
                </Link>{" "}
                to apply
              </p>
            ) : (
              <form onSubmit={onApply} className="mt-5">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  maxLength={2000}
                  placeholder="Why you, and what you would bring to it."
                  className="w-full resize-y border-b border-current/30 bg-transparent py-2 outline-none focus:border-current"
                />
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={applying || !message.trim()}
                    className="border border-current px-4 py-3 font-mono text-[0.65rem] uppercase tracking-widest hover:bg-current/5 disabled:opacity-40"
                  >
                    {applying ? "Sending…" : "Send application"}
                  </button>
                  <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/30">
                    {message.length}/2000
                  </span>
                </div>

                {applyError && (
                  <p role="alert" className="mt-3 text-sm text-red-500">
                    {applyError}
                  </p>
                )}
              </form>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
