import { apiData } from "./api";
import type { FollowStatePayload, RelationshipPayload } from "@/types/api";

const base = (username: string) => `/users/${encodeURIComponent(username)}`;

export const followUser = (username: string) =>
  apiData<FollowStatePayload>(`${base(username)}/follow`, { method: "POST" });

export const unfollowUser = (username: string) =>
  apiData<FollowStatePayload>(`${base(username)}/follow`, { method: "DELETE" });

export const getFollowers = (username: string) =>
  apiData<RelationshipPayload>(`${base(username)}/followers`);

export const getFollowing = (username: string) =>
  apiData<RelationshipPayload>(`${base(username)}/following`);
