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
  /** Per-field messages, present on validation and duplicate-key failures. */
  fields?: Record<string, string>;
};

/** Body accepted by POST /auth/register. */
export type RegisterInput = {
  name: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: "CREATIVE" | "BRAND";
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
  /**
   * Present on your own profile (/users/me) and throughout the admin API.
   * Absent from public profiles — a deactivated account 404s there instead.
   */
  isActive?: boolean;
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
  /** Present on feed/portfolio responses when a viewer is signed in. */
  likedByMe?: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Only public author fields are ever populated onto a comment. */
export type CommentAuthor = Pick<
  User,
  "_id" | "name" | "username" | "role" | "isVerified"
> & { avatar?: Media };

export type Comment = {
  _id: string;
  content: string;
  user: CommentAuthor;
  project: string;
  createdAt: string;
  updatedAt: string;
};

/** Shared shape of every paginated list endpoint. */
export type Paginated = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

export type FeedPayload = Paginated & { projects: Project[] };
export type CreativesPayload = Paginated & { users: User[] };
export type CommentsPayload = {
  comments: Comment[];
  total: number;
  page: number;
  limit: number;
};
export type LikeStatePayload = { likesCount: number; likedByMe: boolean };
export type LikesPayload = {
  users: User[];
  total: number;
  likedByMe: boolean;
  page: number;
  limit: number;
};
export type FollowStatePayload = {
  following: boolean;
  followersCount: number;
  username: string;
};
export type RelationshipPayload = {
  users: User[];
  total: number;
  page: number;
  limit: number;
};

export type FeedQuery = {
  page?: number;
  limit?: number;
  category?: Category | "";
  search?: string;
};

// --- Marketplace (Phase 6) -------------------------------------------------

export const CURRENCIES = ["NGN", "USD", "GHS", "ZAR", "KES"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const ORDER_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "IN_PROGRESS",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

/**
 * A payment attempt. `metadata` is deliberately absent — the server marks it
 * select:false because it holds the raw provider response.
 */
export type Payment = {
  _id: string;
  order: string;
  amount: number;
  currency: Currency;
  provider: "PAYSTACK";
  reference: string;
  status: PaymentStatus;
  paidAt?: string;
  createdAt: string;
};

/** Public creator summary attached to a listing. */
export type ServiceCreator = Pick<
  User,
  "_id" | "name" | "username" | "role" | "isVerified" | "rating" | "reviewsCount"
> & { avatar?: Media };

export type Service = {
  _id: string;
  title: string;
  description: string;
  creator: ServiceCreator;
  category: Category;
  /** Minor units — see lib/money.ts. */
  price: number;
  currency: Currency;
  /** Turnaround in days. */
  deliveryTime: number;
  deliverables: string[];
  media: Media[];
  isActive: boolean;
  ordersCount: number;
  rating: number;
  reviewsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type OrderParty = Pick<
  User,
  "_id" | "name" | "username" | "role"
> & { avatar?: Media; isVerified?: boolean };

export type Order = {
  _id: string;
  client: OrderParty;
  creative: OrderParty;
  service: Pick<
    Service,
    "_id" | "title" | "category" | "price" | "currency" | "deliveryTime" | "isActive"
  > & { media?: Media[] };
  /** Frozen copy taken when the order was placed. */
  serviceSnapshot: {
    title: string;
    price: number;
    currency: Currency;
    deliveryTime: number;
  };
  amount: number;
  currency: Currency;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  /** Set once a Paystack transaction is initialised for this order. */
  paystackReference?: string;
  requirements?: string;
  dueAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Statuses the current viewer is allowed to move this order to. */
  availableTransitions?: OrderStatus[];
};

export type ServicesPayload = Paginated & { services: Service[] };
export type MyServicesPayload = { services: Service[]; count: number };
export type ServicePayload = { service: Service; isOwner: boolean };
export type OrdersPayload = {
  orders: Order[];
  role: "client" | "creative";
  count: number;
};
export type OrderPayload = {
  order: Order;
  relation: "client" | "creative" | "admin";
  availableTransitions: OrderStatus[];
};

/** Body accepted by POST/PUT /services. Price in MINOR units. */
export type ServiceInput = {
  title?: string;
  description?: string;
  category?: Category;
  price?: number;
  currency?: Currency;
  deliveryTime?: number;
  deliverables?: string[];
  media?: string[];
  isActive?: boolean;
};

export type MarketQuery = FeedQuery & {
  sort?: "newest" | "price_asc" | "price_desc" | "popular";
};

// --- Collaboration (Phase 9) ----------------------------------------------

export const COLLABORATION_STATUSES = [
  "OPEN",
  "CLOSED",
  "FILLED",
  "CANCELLED",
] as const;
export type CollaborationStatus = (typeof COLLABORATION_STATUSES)[number];

export type ApplicationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export type CollaborationCreator = Pick<
  User,
  "_id" | "name" | "username" | "role" | "isVerified"
> & { avatar?: Media };

/** Budget bounds are in the currency's MINOR unit — see lib/money.ts. */
export type Budget = {
  min?: number;
  max?: number;
  currency?: Currency;
};

export type Collaboration = {
  _id: string;
  creator: CollaborationCreator;
  title: string;
  description: string;
  category: Category;
  location?: string;
  isRemote: boolean;
  budget?: Budget;
  deadline?: string;
  status: CollaborationStatus;
  applicationsCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Applicant = Pick<
  User,
  "_id" | "name" | "username" | "role" | "isVerified"
> & { avatar?: Media; bio?: string; location?: string; categories?: Category[] };

export type CollaborationApplication = {
  _id: string;
  collaboration: string | Pick<
    Collaboration,
    "_id" | "title" | "category" | "location" | "status" | "deadline" | "budget"
  > & { creator?: CollaborationCreator };
  applicant: Applicant;
  message: string;
  status: ApplicationStatus;
  respondedAt?: string;
  createdAt: string;
};

/** The viewer's own application, returned on the detail page. Never others'. */
export type MyApplication = {
  _id: string;
  status: ApplicationStatus;
  message: string;
  createdAt: string;
  respondedAt?: string;
};

export type CollaborationsPayload = Paginated & {
  collaborations: Collaboration[];
};
export type MyCollaborationsPayload = {
  collaborations: Collaboration[];
  count: number;
};
export type MyApplicationsPayload = {
  applications: CollaborationApplication[];
  count: number;
};
export type CollaborationPayload = {
  collaboration: Collaboration;
  isOwner: boolean;
  myApplication: MyApplication | null;
};
export type ApplicationsPayload = {
  collaboration: Pick<Collaboration, "_id" | "title" | "status">;
  applications: CollaborationApplication[];
  count: number;
};

/** Body accepted by POST/PATCH /collaborations. Budget in MINOR units. */
export type CollaborationInput = {
  title?: string;
  description?: string;
  category?: Category;
  location?: string;
  isRemote?: boolean;
  budget?: Budget;
  deadline?: string | null;
  status?: CollaborationStatus;
};

export type CollaborationQuery = FeedQuery & {
  status?: CollaborationStatus;
  location?: string;
};

// --- Messaging (Phase 10) -------------------------------------------------

export type ChatParticipant = Pick<
  User,
  "_id" | "name" | "username" | "role" | "isVerified"
> & { avatar?: Media };

export type ChatMessage = {
  _id: string;
  conversation: string;
  sender: ChatParticipant;
  content: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
};

/**
 * A conversation as the viewer sees it: the other person, and only the
 * viewer's own unread count — never the other side's.
 */
export type Conversation = {
  _id: string;
  participant: ChatParticipant | null;
  lastMessage: Pick<ChatMessage, "_id" | "content" | "sender" | "createdAt" | "read"> | null;
  lastMessageAt: string;
  unreadCount: number;
  isParticipantOnline: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ConversationsPayload = {
  conversations: Conversation[];
  count: number;
};
export type ConversationPayload = { conversation: Conversation };
export type MessagesPayload = Paginated & { messages: ChatMessage[] };
export type UnreadPayload = { unread: number };

/** Payload of the `message:new` socket event. */
export type NewMessageEvent = {
  conversationId: string;
  message: ChatMessage;
};

/** Payload of `message:read:update`. */
export type ReadUpdateEvent = {
  conversationId: string;
  readBy: string;
  readAt: string;
  count: number;
};

export type PresenceEvent = { userId: string; username: string };

// --- Admin (Phase 11) -----------------------------------------------------

/** Shared pagination envelope used by every admin list. */
export type AdminPaginated = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

export type AdminQuery = {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  category?: Category;
  status?: string;
  paymentStatus?: PaymentStatus;
};

export type AdminStats = {
  users: {
    total: number;
    creatives: number;
    brands: number;
    admins: number;
    active: number;
    deactivated: number;
    verified: number;
  };
  content: {
    projects: number;
    likes: number;
    comments: number;
    reviews: number;
  };
  marketplace: {
    services: number;
    activeServices: number;
    inactiveServices: number;
    orders: number;
    ordersByStatus: Record<string, number>;
    ordersByPaymentStatus: Record<string, number>;
  };
  payments: {
    total: number;
    /** Kept per currency — summing NGN and USD would be meaningless. */
    succeededByCurrency: { currency: Currency; amount: number; count: number }[];
  };
  collaborations: { total: number; open: number; applications: number };
  /** Aggregate only — no admin route exposes private conversations. */
  messaging: { conversations: number; messages: number };
  recent: {
    users: Pick<User, "_id" | "name" | "username" | "role" | "createdAt">[];
    orders: Order[];
  };
};

export type AdminUsersPayload = AdminPaginated & { users: User[] };

export type AdminUserDetailPayload = {
  user: User;
  activity: {
    projectCount: number;
    serviceCount: number;
    ordersPlaced: number;
    ordersReceived: number;
    collaborationsPosted: number;
    applicationsSent: number;
    followers: number;
    following: number;
  };
};

export type AdminProjectsPayload = AdminPaginated & { projects: Project[] };
export type AdminServicesPayload = AdminPaginated & { services: Service[] };
export type AdminOrdersPayload = AdminPaginated & { orders: Order[] };
export type AdminOrderDetailPayload = { order: Order; payments: Payment[] };
export type AdminPaymentsPayload = AdminPaginated & {
  payments: (Payment & { user?: ChatParticipant; order?: Partial<Order> })[];
  summary: Record<string, number>;
};
export type AdminCollaborationsPayload = AdminPaginated & {
  collaborations: Collaboration[];
};

export type AuthPayload = { user: User; token: string };
export type ProfilePayload = {
  user: User;
  isFollowing?: boolean;
  isSelf?: boolean;
};
export type PortfolioPayload = {
  owner: User;
  projects: Project[];
  isOwner: boolean;
  isFollowing: boolean;
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
  /** A full media object from the upload endpoint, or null to clear it. */
  avatar?: Media | null;
  socialLinks?: SocialLinks;
};

/** Body accepted by POST/PUT /projects. */
export type ProjectInput = {
  title?: string;
  description?: string;
  category?: Category;
  /**
   * Uploaded items are sent as full media objects so publicId/resourceType and
   * dimensions survive. Plain URL strings remain valid — the server accepts
   * either, which keeps projects created before uploads existed editable.
   */
  media?: (string | Media)[];
  tags?: string[];
  tools?: string[];
  projectUrl?: string;
  visibility?: Visibility;
};
