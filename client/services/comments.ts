import { apiData, json } from "./api";
import type { Comment, CommentsPayload } from "@/types/api";

export const getComments = (projectId: string) =>
  apiData<CommentsPayload>(
    `/projects/${encodeURIComponent(projectId)}/comments`,
  );

export const postComment = (projectId: string, content: string) =>
  apiData<{ comment: Comment }>(
    `/projects/${encodeURIComponent(projectId)}/comments`,
    { method: "POST", body: json({ content }) },
  );

export const deleteComment = (commentId: string) =>
  apiData<null>(`/comments/${encodeURIComponent(commentId)}`, {
    method: "DELETE",
  });
