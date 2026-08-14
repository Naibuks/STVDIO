import Link from "next/link";
import LikeButton from "./LikeButton";
import SafeMedia from "./SafeMedia";
import type { Project } from "@/types/api";
import { formatCategory } from "@/lib/format";

/** One tile in the portfolio or feed grid. */
export default function ProjectCard({
  project,
  /** Feed context: render a working like control instead of a static count. */
  interactive = false,
  showDescription = false,
}: {
  project: Project;
  interactive?: boolean;
  showDescription?: boolean;
}) {
  const cover = project.coverImage ?? project.media?.[0];

  return (
    <article className="group">
      <Link href={`/portfolio/${project._id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-current/5">
          <SafeMedia
            media={cover}
            alt={project.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            fallback={
              <div className="flex h-full items-center justify-center font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
                No image
              </div>
            }
          />

          {project.visibility !== "PUBLIC" && (
            <span className="absolute left-2 top-2 bg-black/70 px-2 py-1 font-mono text-[0.55rem] uppercase tracking-widest text-white">
              {project.visibility}
            </span>
          )}
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-4">
          <h3 className="text-sm font-medium leading-snug">{project.title}</h3>
          <span className="shrink-0 font-mono text-[0.6rem] uppercase tracking-widest text-current/50">
            {formatCategory(project.category)}
          </span>
        </div>
      </Link>

      <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
        <Link
          href={`/profile/${project.owner?.username ?? ""}`}
          className="hover:opacity-70"
        >
          {project.owner?.name ?? "Unknown"}
        </Link>
      </p>

      {showDescription && project.description && (
        <p className="mt-2 line-clamp-2 text-sm text-current/70">
          {project.description}
        </p>
      )}

      <div className="mt-3 flex items-center gap-4">
        {interactive ? (
          <LikeButton
            projectId={project._id}
            initialCount={project.likesCount}
            initialLiked={project.likedByMe ?? false}
            size="small"
          />
        ) : (
          <span className="font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
            ☆ {project.likesCount}
          </span>
        )}
        <Link
          href={`/portfolio/${project._id}`}
          className="font-mono text-[0.6rem] uppercase tracking-widest text-current/40 hover:opacity-70"
        >
          ✎ {project.commentsCount}
        </Link>
      </div>
    </article>
  );
}
