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
      <main className="px-6 py-20 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-[#f5f1ea]/40">
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-10 text-[#f5f1ea] sm:px-6 lg:px-12">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-8 border-b border-[#1d1d1d] pb-8">
          <p className="font-mono text-[0.58rem] uppercase tracking-[0.28em] text-[#f5f1ea]/55">
            Studio workspace
          </p>
          <h1 className="mt-3 text-2xl font-medium tracking-[-0.06em] text-[#f5f1ea] sm:text-3xl">
            New work
          </h1>
        </header>

        <ProjectForm
          submitLabel="Publish"
          onSubmit={onSubmit}
          onCancel={() => router.push("/profile")}
          errors={errors}
          saving={saving}
        />
      </div>
    </main>
  );
}
