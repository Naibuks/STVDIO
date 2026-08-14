import Link from "next/link";
import LikeButton from "./LikeButton";
import SafeMedia from "./SafeMedia";
import type { Project } from "@/types/api";
import { formatCategory } from "@/lib/format";

/** One tile in the portfolio or feed grid. */
export default function ProjectCard({
  project,
  interactive = false,
  showDescription = false,
}: {
  project: Project;
  interactive?: boolean;
  showDescription?: boolean;
}) {
  const cover = project.coverImage ?? project.media?.[0];

  return (
    <article className="group border border-[#1d1d1d] bg-[#0d0d0d] transition-colors duration-200 hover:border-[#2c2c2c]">
      <Link href={`/portfolio/${project._id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#111111]">
          <SafeMedia
            media={cover}
            alt={project.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            fallback={
              <div className="flex h-full items-center justify-center font-mono text-[0.58rem] uppercase tracking-[0.28em] text-[#f3efe8]/40">
                No image
              </div>
            }
          />

          {project.visibility !== "PUBLIC" && (
            <span className="absolute left-2 top-2 bg-black/70 px-2 py-1 font-mono text-[0.5rem] uppercase tracking-[0.22em] text-[#f3efe8]">
              {project.visibility}
            </span>
          )}
        </div>

        <div className="border-t border-[#1d1d1d] p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[1.6rem] leading-none tracking-[-0.06em] text-[#f8f5f1]">
              {project.title}
            </h3>
            <span className="mt-1 shrink-0 font-mono text-[0.5rem] uppercase tracking-[0.22em] text-[#f3efe8]/50">
              {formatCategory(project.category)}
            </span>
          </div>

          {showDescription && project.description && (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-[#f3efe8]/68">
              {project.description}
            </p>
          )}
        </div>
      </Link>

      <div className="border-t border-[#1d1d1d] px-4 pb-4 pt-3">
        <p className="font-mono text-[0.5rem] uppercase tracking-[0.22em] text-[#f3efe8]/45">
          <Link href={`/profile/${project.owner?.username ?? ""}`} className="hover:text-[#f3efe8]">
            {project.owner?.name ?? "Unknown"}
          </Link>
        </p>

        <div className="mt-4 flex items-center gap-4 border-t border-[#1d1d1d] pt-3">
          {interactive ? (
            <LikeButton
              projectId={project._id}
              initialCount={project.likesCount}
              initialLiked={project.likedByMe ?? false}
              size="small"
            />
          ) : (
            <span className="font-mono text-[0.52rem] uppercase tracking-[0.2em] text-[#f3efe8]/45">
              ☆ {project.likesCount}
            </span>
          )}
          <Link
            href={`/portfolio/${project._id}`}
            className="font-mono text-[0.52rem] uppercase tracking-[0.2em] text-[#f3efe8]/45 hover:text-[#f3efe8]"
          >
            ✎ {project.commentsCount}
          </Link>
        </div>
      </div>
    </article>
  );
}
