import { apiData } from "./api";
import type { LikeStatePayload, LikesPayload } from "@/types/api";

const base = (projectId: string) =>
  `/projects/${encodeURIComponent(projectId)}`;

export const likeProject = (projectId: string) =>
  apiData<LikeStatePayload>(`${base(projectId)}/like`, { method: "POST" });

export const unlikeProject = (projectId: string) =>
  apiData<LikeStatePayload>(`${base(projectId)}/like`, { method: "DELETE" });

export const getLikes = (projectId: string) =>
  apiData<LikesPayload>(`${base(projectId)}/likes`);
