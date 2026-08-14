"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import LikeButton from "@/components/LikeButton";
import CommentSection from "@/components/CommentSection";
import SafeMedia from "@/components/SafeMedia";
import { deleteProject, getProject } from "@/services/projects";
import { formatCategory, formatDate } from "@/lib/format";
import type { Project } from "@/types/api";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getProject(id)
      .then(({ project }) => setProject(project))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Project not found"),
      );
  }, [id]);

  // Owner controls are also gated server-side; this only decides what to show.
  const isOwner = Boolean(
    project && user && (project.owner._id === user._id || user.role === "ADMIN"),
  );

  const onDelete = async () => {
    if (!window.confirm("Delete this project? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await deleteProject(id);
      router.push("/profile");
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

  if (!project) {
    return (
      <main className="px-6 py-20 font-mono text-xs uppercase tracking-widest text-current/40">
        Loading…
      </main>
    );
  }

  return (
    <main className="px-6 py-12 sm:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-current/15 pb-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0">
              <p className="font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
                {formatCategory(project.category)}
                {project.visibility !== "PUBLIC" && ` · ${project.visibility}`}
              </p>
              <h1 className="mt-2 text-3xl font-medium tracking-tight sm:text-5xl">
                {project.title}
              </h1>
              <p className="mt-3 font-mono text-[0.65rem] uppercase tracking-widest text-current/50">
                <Link
                  href={`/profile/${project.owner.username}`}
                  className="underline underline-offset-4 hover:opacity-60"
                >
                  {project.owner.name}
                </Link>
                {" · "}
                {formatDate(project.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-3 font-mono text-[0.65rem] uppercase tracking-widest">
              <LikeButton
                projectId={project._id}
                initialCount={project.likesCount}
                initialLiked={project.likedByMe ?? false}
              />
            </div>

            {isOwner && (
              <div className="flex gap-3 font-mono text-[0.65rem] uppercase tracking-widest">
                <Link
                  href={`/portfolio/${project._id}/edit`}
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
        </header>

        {project.description && (
          <p className="mt-8 max-w-2xl whitespace-pre-line leading-relaxed text-current/80">
            {project.description}
          </p>
        )}

        <div className="mt-10 space-y-6">
          {project.media.map((item, index) => (
            <SafeMedia
              key={`${item.url}-${index}`}
              media={item}
              alt={`${project.title} — item ${index + 1}`}
              className="w-full bg-current/5 object-cover"
              // Full size: videos get controls rather than silent autoplay.
              variant="full"
              fallback={
                <div className="flex aspect-[4/3] w-full items-center justify-center bg-current/5 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
                  Media unavailable
                </div>
              }
            />
          ))}
        </div>

        <dl className="mt-12 grid gap-6 border-t border-current/15 pt-8 font-mono text-[0.65rem] uppercase tracking-widest sm:grid-cols-3">
          {project.tools.length > 0 && (
            <div>
              <dt className="text-current/40">Tools</dt>
              <dd className="mt-2 normal-case tracking-normal">
                {project.tools.join(", ")}
              </dd>
            </div>
          )}
          {project.tags.length > 0 && (
            <div>
              <dt className="text-current/40">Tags</dt>
              <dd className="mt-2 normal-case tracking-normal">
                {project.tags.join(", ")}
              </dd>
            </div>
          )}
          {project.projectUrl && (
            <div>
              <dt className="text-current/40">Link</dt>
              <dd className="mt-2">
                <a
                  href={project.projectUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline underline-offset-4 hover:opacity-60"
                >
                  View project
                </a>
              </dd>
            </div>
          )}
        </dl>

        <CommentSection
          projectId={project._id}
          projectOwnerId={project.owner._id}
        />
      </div>
    </main>
  );
}
