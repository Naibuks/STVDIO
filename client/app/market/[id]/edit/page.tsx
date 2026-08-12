"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ServiceForm from "@/components/ServiceForm";
import { ApiRequestError } from "@/services/api";
import { getService, updateService } from "@/services/marketplace";
import type { Service, ServiceInput } from "@/types/api";

export default function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();

  const [service, setService] = useState<Service | null>(null);
  const [denied, setDenied] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [relisting, setRelisting] = useState(false);

  const load = useCallback(
    () =>
      Promise.resolve()
        .then(() => getService(id))
        .then((data) => {
          // The server is the real gate; this only avoids showing a form that
          // would be rejected on submit.
          if (!data.isOwner && user?.role !== "ADMIN") {
            setDenied(true);
            return;
          }
          setService(data.service);
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

  const save = async (input: ServiceInput) => {
    setFieldErrors({});
    setFormError(null);
    setSaving(true);
    try {
      await updateService(id, input);
      router.push(`/market/${id}`);
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

  const relist = async () => {
    setRelisting(true);
    try {
      await updateService(id, { isActive: true });
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not relist");
    } finally {
      setRelisting(false);
    }
  };

  if (denied) {
    return (
      <main className="px-6 py-20">
        <h1 className="text-2xl font-medium tracking-tight">Not allowed</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-current/50">
          You can only edit your own services
        </p>
      </main>
    );
  }

  if (loading || !service) {
    return (
      <main className="px-6 py-20 font-mono text-xs uppercase tracking-widest text-current/40">
        {formError ?? "Loading…"}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14">
      <h1 className="text-2xl font-medium tracking-tight">Edit service</h1>

      {!service.isActive && (
        <div className="mt-4 flex flex-wrap items-center gap-4 border border-current/20 p-4">
          <p className="font-mono text-[0.6rem] uppercase tracking-widest text-current/50">
            This service is unlisted
          </p>
          <button
            type="button"
            onClick={relist}
            disabled={relisting}
            className="border border-current px-3 py-2 font-mono text-[0.6rem] uppercase tracking-widest hover:bg-current/5 disabled:opacity-40"
          >
            {relisting ? "Relisting…" : "Relist on marketplace"}
          </button>
        </div>
      )}

      <ServiceForm
        initial={service}
        submitLabel="Save changes"
        onSubmit={save}
        onCancel={() => router.push(`/market/${id}`)}
        fieldErrors={fieldErrors}
        formError={formError}
        saving={saving}
      />
    </main>
  );
}
