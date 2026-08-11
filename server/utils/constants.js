/**
 * Shared enums for the STVDIO° data layer.
 *
 * Every schema enum is defined here so that models, future controllers and the
 * frontend all read from one source of truth. Values are uppercase strings
 * rather than numbers so documents stay readable in MongoDB Compass.
 */

const USER_ROLES = {
  CREATIVE: "CREATIVE",
  BRAND: "BRAND",
  ADMIN: "ADMIN",
};

/** Creative disciplines. Used by projects, services and collaborations. */
const CATEGORIES = [
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
  "OTHER",
];

const PROJECT_VISIBILITY = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
  UNLISTED: "UNLISTED",
};

/** Lifecycle of a purchased service, independent of whether money moved. */
const ORDER_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  IN_PROGRESS: "IN_PROGRESS",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  DISPUTED: "DISPUTED",
};

/** Money state. Kept separate from ORDER_STATUS so the two can disagree. */
const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
};

const PAYMENT_PROVIDERS = {
  PAYSTACK: "PAYSTACK",
};

/** ISO 4217 codes supported at launch. NGN is the default. */
const CURRENCIES = ["NGN", "USD", "GHS", "ZAR", "KES"];

const COLLABORATION_STATUS = {
  OPEN: "OPEN",
  CLOSED: "CLOSED",
  FILLED: "FILLED",
  CANCELLED: "CANCELLED",
};

const APPLICATION_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  WITHDRAWN: "WITHDRAWN",
};

const NOTIFICATION_TYPES = {
  NEW_FOLLOWER: "NEW_FOLLOWER",
  PROJECT_LIKED: "PROJECT_LIKED",
  PROJECT_COMMENTED: "PROJECT_COMMENTED",
  NEW_MESSAGE: "NEW_MESSAGE",
  COLLABORATION_APPLICATION: "COLLABORATION_APPLICATION",
  COLLABORATION_ACCEPTED: "COLLABORATION_ACCEPTED",
  COLLABORATION_REJECTED: "COLLABORATION_REJECTED",
  ORDER_RECEIVED: "ORDER_RECEIVED",
  ORDER_STATUS_CHANGED: "ORDER_STATUS_CHANGED",
  PAYMENT_SUCCESSFUL: "PAYMENT_SUCCESSFUL",
  NEW_REVIEW: "NEW_REVIEW",
};

/** Polymorphic target of a notification's `relatedId`. */
const NOTIFICATION_TARGETS = {
  USER: "User",
  PROJECT: "Project",
  COMMENT: "Comment",
  ORDER: "Order",
  COLLABORATION: "Collaboration",
  COLLABORATION_APPLICATION: "CollaborationApplication",
  CONVERSATION: "Conversation",
  REVIEW: "Review",
};

/** Turns an enum object into the array Mongoose's `enum` option expects. */
const values = (enumObject) => Object.values(enumObject);

module.exports = {
  USER_ROLES,
  CATEGORIES,
  PROJECT_VISIBILITY,
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_PROVIDERS,
  CURRENCIES,
  COLLABORATION_STATUS,
  APPLICATION_STATUS,
  NOTIFICATION_TYPES,
  NOTIFICATION_TARGETS,
  values,
};
