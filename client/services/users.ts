import { apiData, json } from "./api";
import type {
  AuthPayload,
  PortfolioPayload,
  ProfilePayload,
  ProfileUpdate,
  RegisterInput,
} from "@/types/api";

export const login = (identifier: string, password: string) =>
  apiData<AuthPayload>("/auth/login", {
    method: "POST",
    body: json({ identifier, password }),
  });

export const register = (input: RegisterInput) =>
  apiData<AuthPayload>("/auth/register", {
    method: "POST",
    body: json(input),
  });

/** The authenticated user's own profile, including private fields. */
export const getMe = () => apiData<ProfilePayload>("/users/me");

export const updateMe = (patch: ProfileUpdate) =>
  apiData<ProfilePayload>("/users/me", { method: "PUT", body: json(patch) });

export const deleteMe = ({ confirmation }: { confirmation: string }) =>
  apiData<{
    deletedUserId: string;
    deletedProjects: boolean;
    deletedServices: boolean;
    deletedConversations: number;
    preservedFinancialHistory: boolean;
  }>("/users/me", {
    method: "DELETE",
    body: json({ confirmation }),
  });

export const getProfile = (username: string) =>
  apiData<ProfilePayload>(`/users/${encodeURIComponent(username)}`);

export const getPortfolio = (username: string) =>
  apiData<PortfolioPayload>(
    `/users/${encodeURIComponent(username)}/projects`,
  );
