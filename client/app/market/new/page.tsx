"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ServiceForm from "@/components/ServiceForm";
import { ApiRequestError } from "@/services/api";
import { createService } from "@/services/marketplace";
import type { ServiceInput } from "@/types/api";

export default function NewServicePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const onSubmit = async (input: ServiceInput) => {
    setFieldErrors({});
    setFormError(null);
    setSaving(true);
    try {
      const { service } = await createService(input);
      router.push(`/market/${service._id}`);
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

  if (loading || !user) {
    return (
      <main className="px-6 py-20 font-mono text-xs uppercase tracking-widest text-current/40">
        Loading…
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14">
      <h1 className="text-2xl font-medium tracking-tight">Offer a service</h1>
      <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
        List what you do on the STVDIO° marketplace
      </p>
      <ServiceForm
        submitLabel="Publish service"
        onSubmit={onSubmit}
        onCancel={() => router.push("/market")}
        fieldErrors={fieldErrors}
        formError={formError}
        saving={saving}
      />
    </main>
  );
}
