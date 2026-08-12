import { apiData, json } from "./api";
import type {
  ApplicationStatus,
  ApplicationsPayload,
  Collaboration,
  CollaborationApplication,
  CollaborationInput,
  CollaborationPayload,
  CollaborationQuery,
  CollaborationsPayload,
  MyApplicationsPayload,
  MyCollaborationsPayload,
} from "@/types/api";

const toQuery = (query: CollaborationQuery = {}) => {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));
  if (query.category) params.set("category", query.category);
  if (query.status) params.set("status", query.status);
  if (query.location?.trim()) params.set("location", query.location.trim());
  if (query.search?.trim()) params.set("search", query.search.trim());
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

const base = (id: string) => `/collaborations/${encodeURIComponent(id)}`;

export const browseCollaborations = (query?: CollaborationQuery) =>
  apiData<CollaborationsPayload>(`/collaborations${toQuery(query)}`);

/** Opportunities the caller posted, in any state. */
export const getMyCollaborations = () =>
  apiData<MyCollaborationsPayload>("/collaborations/mine");

/** Applications the caller has sent, with their outcome. */
export const getMyApplications = () =>
  apiData<MyApplicationsPayload>("/collaborations/mine/applications");

export const getCollaboration = (id: string) =>
  apiData<CollaborationPayload>(base(id));

export const createCollaboration = (input: CollaborationInput) =>
  apiData<{ collaboration: Collaboration }>("/collaborations", {
    method: "POST",
    body: json(input),
  });

export const updateCollaboration = (id: string, input: CollaborationInput) =>
  apiData<{ collaboration: Collaboration }>(base(id), {
    method: "PATCH",
    body: json(input),
  });

export const deleteCollaboration = (id: string) =>
  apiData<{ id: string; applicationsRemoved: number }>(base(id), {
    method: "DELETE",
  });

export const applyToCollaboration = (id: string, message: string) =>
  apiData<{ application: CollaborationApplication }>(`${base(id)}/applications`, {
    method: "POST",
    body: json({ message }),
  });

/** Creator only — the server returns 403 for anyone else. */
export const getApplications = (id: string) =>
  apiData<ApplicationsPayload>(`${base(id)}/applications`);

export const respondToApplication = (
  id: string,
  applicationId: string,
  status: Extract<ApplicationStatus, "ACCEPTED" | "REJECTED">,
) =>
  apiData<{ application: CollaborationApplication }>(
    `${base(id)}/applications/${encodeURIComponent(applicationId)}`,
    { method: "PATCH", body: json({ status }) },
  );
