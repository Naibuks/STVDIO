"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ProjectForm from "@/components/ProjectForm";
import { getProject, updateProject } from "@/services/projects";
import { ApiRequestError } from "@/services/api";
import type { Project, ProjectInput } from "@/types/api";

export default function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    getProject(id)
      .then(({ project }) => {
        // The server is the real gate; this only avoids showing a form that
        // would be rejected on submit.
        if (project.owner._id !== user._id && user.role !== "ADMIN") {
          setDenied(true);
          return;
        }
        setProject(project);
      })
      .catch((err) =>
        setErrors([err instanceof Error ? err.message : "Not found"]),
      );
  }, [id, user, loading, router]);

  const onSubmit = async (input: ProjectInput) => {
    setErrors([]);
    setSaving(true);
    try {
      await updateProject(id, input);
      router.push(`/portfolio/${id}`);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setErrors(err.errors?.length ? err.errors : [err.message]);
      } else {
        setErrors([err instanceof Error ? err.message : "Could not save"]);
      }
      setSaving(false);
    }
  };

  if (denied) {
    return (
      <main className="px-6 py-20">
        <h1 className="text-2xl font-medium tracking-tight">Not allowed</h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-current/50">
          You can only edit your own work
        </p>
      </main>
    );
  }

  if (loading || !project) {
    return (
      <main className="px-6 py-20 font-mono text-xs uppercase tracking-widest text-current/40">
        {errors.length ? errors[0] : "Loading…"}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14">
      <h1 className="text-2xl font-medium tracking-tight">Edit work</h1>
      <ProjectForm
        initial={project}
        submitLabel="Save changes"
        onSubmit={onSubmit}
        onCancel={() => router.push(`/portfolio/${id}`)}
        errors={errors}
        saving={saving}
      />
    </main>
  );
}
