import ProjectCard from "./ProjectCard";
import type { Project } from "@/types/api";

export default function ProjectGrid({
  projects,
  emptyMessage = "No work published yet.",
}: {
  projects: Project[];
  emptyMessage?: string;
}) {
  if (projects.length === 0) {
    return (
      <p className="border-t border-current/15 py-8 font-mono text-xs uppercase tracking-widest text-current/40">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project._id} project={project} />
      ))}
    </div>
  );
}
