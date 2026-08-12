"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import CollaborationForm from "@/components/CollaborationForm";
import { ApiRequestError } from "@/services/api";
import {
  getCollaboration,
  updateCollaboration,
} from "@/services/collaborations";
import {
  COLLABORATION_STATUSES,
  type Collaboration,
  type CollaborationInput,
  type CollaborationStatus,
} from "@/types/api";

export default function EditCollaborationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();

  const [collaboration, setCollaboration] = useState<Collaboration | null>(null);
  const [denied, setDenied] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);

  const load = useCallback(
    () =>
      Promise.resolve()
        .then(() => getCollaboration(id))
        .then((data) => {
          // The server is the real gate; this only avoids showing a form that
          // would be rejected on submit.
          if (!data.isOwner && user?.role !== "ADMIN") {
            setDenied(true);
            return;
          }
          setCollaboration(data.collaboration);
        })
        .catch((err: unknown) =>
          setFormError(err instanceof Error ? err.message : "Not found"),
        ),
    [id, user],
  );

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    load();
  }, [loading, user, router, load]);

  const save = async (input: CollaborationInput) => {
    setFieldErrors({});
    setFormError(null);
    setSaving(true);
    try {
      await updateCollaboration(id, input);
      router.push(`/collaborations/${id}`);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setFieldErrors(err.fields ?? {});
        if (!err.fields || Object.keys(err.fields).length === 0) {
          setFormError(err.errors?.join(" · ") ?? err.message);
        }
      } else {
        setFormError(err instanceof Error ? err.message : "Could not save");
      }
      setSaving(false);
    }
  };

  /** Closing an opportunity is a status change, not a separate endpoint. */
  const setStatus = async (status: CollaborationStatus) => {
    setChangingStatus(true);
    setFormError(null);
    try {
      await updateCollaboration(id, { status });
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not update");
    } finally {
      setChangingStatus(false);
    }
  };

  if (denied) {
    return (
      <main className="px-6 py-20">
        <h1 className="text-2xl font-medium tracking-tight">Not allowed</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-current/50">
          You can only edit your own opportunities
        </p>
      </main>
    );
  }

  if (loading || !collaboration) {
    return (
      <main className="px-6 py-20 font-mono text-xs uppercase tracking-widest text-current/40">
        {formError ?? "Loading…"}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14">
      <h1 className="text-2xl font-medium tracking-tight">Edit brief</h1>

      <div className="mt-5 border border-current/20 p-4">
        <p className="font-mono text-[0.6rem] uppercase tracking-widest text-current/50">
          Status — {collaboration.status}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {COLLABORATION_STATUSES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              disabled={changingStatus || collaboration.status === option}
              aria-pressed={collaboration.status === option}
              className={`border px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest transition disabled:opacity-40 ${
                collaboration.status === option
                  ? "border-current bg-current/10"
                  : "border-current/20 text-current/60 hover:border-current/40"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="mt-3 font-mono text-[0.55rem] uppercase leading-relaxed tracking-widest text-current/30">
          Only OPEN briefs accept new applications. Existing applications stay
          visible to you either way.
        </p>
      </div>

      <CollaborationForm
        initial={collaboration}
        submitLabel="Save changes"
        onSubmit={save}
        onCancel={() => router.push(`/collaborations/${id}`)}
        fieldErrors={fieldErrors}
        formError={formError}
        saving={saving}
      />
    </main>
  );
}
