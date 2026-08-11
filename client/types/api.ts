export type HealthResponse = {
  status: string;
  service: string;
  database: "connected" | "disconnected";
  models?: number;
  uptime: number;
  timestamp: string;
};

export type ApiError = {
  success: false;
  message: string;
  errors?: string[];
};

/** Every non-health endpoint returns this envelope. */
export type ApiResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type UserRole = "CREATIVE" | "BRAND" | "ADMIN";

export const CATEGORIES = [
  "GRAPHIC_DESIGN",
  "UI_UX",
  "PHOTOGRAPHY",
  "VIDEOGRAPHY",
  "MODELLING",
  "ILLUSTRATION",
  "ANIMATION",
  "ART",
  "STYLING",
  "CREATIVE_DIRECTION",
  "MUSIC",
  "CONTENT_CREATION",
  "BRANDING",
  "DEVELOPER",
  "OTHER",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const VISIBILITIES = ["PUBLIC", "UNLISTED", "PRIVATE"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export type Media = {
  url: string;
  publicId?: string;
  resourceType?: "image" | "video" | "raw";
  width?: number;
  height?: number;
};

export type SocialLinks = {
  instagram?: string;
  behance?: string;
  dribbble?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
};

/** A public profile. `email` is present only on your own profile. */
export type User = {
  _id: string;
  name: string;
  username: string;
  email?: string;
  role: UserRole;
  avatar?: Media;
  coverImage?: Media;
  bio?: string;
  location?: string;
  skills: string[];
  categories: Category[];
  website?: string;
  socialLinks?: SocialLinks;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  projectsCount: number;
  rating: number;
  reviewsCount: number;
  createdAt: string;
};

export type Project = {
  _id: string;
  title: string;
  description?: string;
  media: Media[];
  coverImage: Media | null;
  category: Category;
  tags: string[];
  tools: string[];
  projectUrl?: string;
  owner: Pick<User, "_id" | "name" | "username" | "role"> & { avatar?: Media };
  collaborators?: string[];
  visibility: Visibility;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AuthPayload = { user: User; token: string };
export type ProfilePayload = { user: User };
export type PortfolioPayload = {
  owner: User;
  projects: Project[];
  isOwner: boolean;
  count: number;
};
export type ProjectPayload = { project: Project; isOwner?: boolean };
export type ProjectListPayload = { projects: Project[]; count: number };

/** Body accepted by PUT /users/me — only editable fields. */
export type ProfileUpdate = {
  name?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  skills?: string[];
  categories?: Category[];
  avatar?: { url: string } | null;
  socialLinks?: SocialLinks;
};

/** Body accepted by POST/PUT /projects. */
export type ProjectInput = {
  title?: string;
  description?: string;
  category?: Category;
  media?: string[];
  tags?: string[];
  tools?: string[];
  projectUrl?: string;
  visibility?: Visibility;
};
