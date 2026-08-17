import type { ComponentProps } from "react";
import ProjectCard from "./ProjectCard";
import type { Project } from "@/types/api";

export default function ProjectGrid({
  projects,
  emptyMessage = "No work published yet.",
  interactive = false,
  showDescription = false,
  /** Thumbnail shape — portfolio grids use the compact square. */
  frame,
}: {
  projects: Project[];
  emptyMessage?: string;
  interactive?: boolean;
  showDescription?: boolean;
  frame?: ComponentProps<typeof ProjectCard>["frame"];
}) {
  if (projects.length === 0) {
    return (
      <p className="border-t border-[#1d1d1d] py-8 font-mono text-[0.56rem] uppercase tracking-[0.3em] text-[#f3efe8]/40">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard
          key={project._id}
          project={project}
          interactive={interactive}
          showDescription={showDescription}
          frame={frame}
        />
      ))}
    </div>
  );
}
