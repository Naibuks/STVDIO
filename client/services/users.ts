import { apiData, json } from "./api";
import type {
  AuthPayload,
  PortfolioPayload,
  ProfilePayload,
  ProfileUpdate,
} from "@/types/api";

export const login = (email: string, password: string) =>
  apiData<AuthPayload>("/auth/login", {
    method: "POST",
    body: json({ email, password }),
  });

export const register = (input: {
  name: string;
  username: string;
  email: string;
  password: string;
  role?: string;
}) =>
  apiData<AuthPayload>("/auth/register", {
    method: "POST",
    body: json(input),
  });

/** The authenticated user's own profile, including private fields. */
export const getMe = () => apiData<ProfilePayload>("/users/me");

export const updateMe = (patch: ProfileUpdate) =>
  apiData<ProfilePayload>("/users/me", { method: "PUT", body: json(patch) });

export const getProfile = (username: string) =>
  apiData<ProfilePayload>(`/users/${encodeURIComponent(username)}`);

export const getPortfolio = (username: string) =>
  apiData<PortfolioPayload>(
    `/users/${encodeURIComponent(username)}/projects`,
  );
