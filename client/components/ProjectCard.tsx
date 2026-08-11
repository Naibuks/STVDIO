import Link from "next/link";
import type { Project } from "@/types/api";
import { formatCategory } from "@/lib/format";

/**
 * One tile in the portfolio grid.
 *
 * Uses a plain <img> rather than next/image because cover images are arbitrary
 * URLs typed in by users; next/image would require every possible host to be
 * declared in remotePatterns. Revisit when Cloudinary lands and all media
 * comes from one known host.
 */
export default function ProjectCard({ project }: { project: Project }) {
  const cover = project.coverImage ?? project.media?.[0];

  return (
    <Link href={`/portfolio/${project._id}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden bg-current/5">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url}
            alt={project.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
            No image
          </div>
        )}

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
      <p className="mt-1 font-mono text-[0.6rem] uppercase tracking-widest text-current/40">
        {project.owner?.name ?? "Unknown"}
      </p>
    </Link>
  );
}
