"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ProjectForm from "@/components/ProjectForm";
import { createProject } from "@/services/projects";
import { ApiRequestError } from "@/services/api";
import type { ProjectInput } from "@/types/api";

export default function NewProjectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const onSubmit = async (input: ProjectInput) => {
    setErrors([]);
    setSaving(true);
    try {
      const { project } = await createProject(input);
      router.push(`/portfolio/${project._id}`);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setErrors(err.errors?.length ? err.errors : [err.message]);
      } else {
        setErrors([err instanceof Error ? err.message : "Could not save"]);
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
      <h1 className="text-2xl font-medium tracking-tight">New work</h1>
      <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
        Upload photos and videos from your device
      </p>
      <ProjectForm
        submitLabel="Publish"
        onSubmit={onSubmit}
        onCancel={() => router.push("/profile")}
        errors={errors}
        saving={saving}
      />
    </main>
  );
}
