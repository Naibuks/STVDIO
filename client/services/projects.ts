import { apiData, json } from "./api";
import type {
  ProjectInput,
  ProjectListPayload,
  ProjectPayload,
} from "@/types/api";

export const createProject = (input: ProjectInput) =>
  apiData<ProjectPayload>("/projects", { method: "POST", body: json(input) });

/** The caller's own projects, private ones included. */
export const getMyProjects = () => apiData<ProjectListPayload>("/projects/my");

export const getProject = (id: string) =>
  apiData<ProjectPayload>(`/projects/${encodeURIComponent(id)}`);

export const updateProject = (id: string, input: ProjectInput) =>
  apiData<ProjectPayload>(`/projects/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: json(input),
  });

export const deleteProject = (id: string) =>
  apiData<null>(`/projects/${encodeURIComponent(id)}`, { method: "DELETE" });
