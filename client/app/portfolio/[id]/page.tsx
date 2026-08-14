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
      <main className="min-h-screen bg-[#080808] px-4 py-20 text-[#f5f1ea] sm:px-6 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-medium tracking-[-0.08em]">Not found</h1>
          <p className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[#f5f1ea]/50">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-[#080808] px-6 py-20 font-mono text-[0.62rem] uppercase tracking-[0.24em] text-[#f5f1ea]/40">
        Loading…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-10 text-[#f5f1ea] sm:px-6 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="border-b border-[#1d1d1d] pb-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-[#f5f1ea]/55">
                {formatCategory(project.category)}
                {project.visibility !== "PUBLIC" && ` · ${project.visibility}`}
              </p>
              <h1 className="mt-3 text-4xl font-medium tracking-[-0.08em] text-[#f5f1ea] sm:text-5xl">
                {project.title}
              </h1>
              <p className="mt-4 font-mono text-[0.58rem] uppercase tracking-[0.22em] text-[#f5f1ea]/55">
                <Link href={`/profile/${project.owner.username}`} className="text-[#f5f1ea]/75 hover:text-[#f5f1ea]">
                  {project.owner.name}
                </Link>
                {" · "}
                {formatDate(project.createdAt)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 font-mono text-[0.58rem] uppercase tracking-[0.22em]">
              <LikeButton
                projectId={project._id}
                initialCount={project.likesCount}
                initialLiked={project.likedByMe ?? false}
              />
            </div>

            {isOwner && (
              <div className="flex flex-wrap gap-3 font-mono text-[0.58rem] uppercase tracking-[0.22em]">
                <Link
                  href={`/portfolio/${project._id}/edit`}
                  className="border border-[#2a2a2a] bg-[#111111] px-4 py-2.5 transition hover:border-[#d66a38]"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={onDelete}
                  disabled={deleting}
                  className="border border-[#f76b5f]/60 px-4 py-2.5 text-[#f76b5f] transition hover:bg-[#f76b5f]/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            )}
          </div>
        </header>

        {project.description && (
          <p className="mt-8 max-w-3xl whitespace-pre-line text-base leading-relaxed text-[#f5f1ea]/72">
            {project.description}
          </p>
        )}

        <div className="mt-10 space-y-6">
          {project.media.map((item, index) => (
            <SafeMedia
              key={`${item.url}-${index}`}
              media={item}
              alt={`${project.title} — item ${index + 1}`}
              className="w-full border border-[#1d1d1d] bg-[#111111] object-cover"
              // Full size: videos get controls rather than silent autoplay.
              variant="full"
              fallback={
                <div className="flex aspect-[4/3] w-full items-center justify-center border border-[#1d1d1d] bg-[#111111] font-mono text-[0.6rem] uppercase tracking-[0.22em] text-[#f5f1ea]/35">
                  Media unavailable
                </div>
              }
            />
          ))}
        </div>

        <dl className="mt-12 grid gap-6 border-t border-[#1d1d1d] pt-8 font-mono text-[0.58rem] uppercase tracking-[0.22em] sm:grid-cols-3">
          {project.tools.length > 0 && (
            <div>
              <dt className="text-[#f5f1ea]/45">Tools</dt>
              <dd className="mt-2 normal-case tracking-normal text-[#f5f1ea]/75">
                {project.tools.join(", ")}
              </dd>
            </div>
          )}
          {project.tags.length > 0 && (
            <div>
              <dt className="text-[#f5f1ea]/45">Tags</dt>
              <dd className="mt-2 normal-case tracking-normal text-[#f5f1ea]/75">
                {project.tags.join(", ")}
              </dd>
            </div>
          )}
          {project.projectUrl && (
            <div>
              <dt className="text-[#f5f1ea]/45">Link</dt>
              <dd className="mt-2">
                <a
                  href={project.projectUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-[#f7c1a4] underline decoration-[#d66a38]/60 underline-offset-4 hover:text-[#f5f1ea]"
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
