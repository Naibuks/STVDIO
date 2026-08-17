import Link from "next/link";
import LikeButton from "./LikeButton";
import SafeMedia from "./SafeMedia";
import type { Project } from "@/types/api";
import { formatCategory } from "@/lib/format";

/**
 * The thumbnail frame each grid uses.
 *
 * The ratio belongs to the grid, not to the image: uploads arrive as 1:1,
 * 16:9, 9:16 and everything between, and letting each one set its own height
 * made the feed and portfolio ragged. A fixed ratio plus object-cover gives
 * every tile identical dimensions, cropping rather than distorting. Full,
 * uncropped media is what the detail page is for.
 *
 * Written as whole class strings so Tailwind's scanner still sees them.
 */
const FRAMES = {
  /** Feed and Explore — a medium portrait card. */
  feed: "aspect-[4/5]",
  /** Portfolio grids — compact, so a profile reads at a glance. */
  square: "aspect-square",
} as const;

/** One tile in the portfolio or feed grid. */
export default function ProjectCard({
  project,
  interactive = false,
  showDescription = false,
  frame = "feed",
}: {
  project: Project;
  interactive?: boolean;
  showDescription?: boolean;
  frame?: keyof typeof FRAMES;
}) {
  const cover = project.coverImage ?? project.media?.[0];

  return (
    <article className="group border border-[#1d1d1d] bg-[#0d0d0d] transition-colors duration-200 hover:border-[#2c2c2c]">
      <div className="relative">
        <Link
          href={`/portfolio/${project._id}`}
          className={`block overflow-hidden ${FRAMES[frame]}`}
        >
          <SafeMedia
            media={cover}
            alt={project.title}
            className="block h-full w-full object-cover transition duration-500 group-hover:scale-[1.01]"
            fallback={
              <div className="flex h-full w-full items-center justify-center font-mono text-[0.58rem] uppercase tracking-[0.28em] text-[#f3efe8]/40">
                No image
              </div>
            }
          />
        </Link>

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
