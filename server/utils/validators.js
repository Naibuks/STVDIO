/**
 * Small hand-written request validators.
 *
 * Deliberately not express-validator or zod: the schema-level rules in the
 * Mongoose models already do the heavy lifting, and these only need to reject
 * obviously malformed input before it reaches the database. Adding a
 * validation library for four fields would be a dependency that has to be
 * justified at assessment.
 *
 * Each validator returns { errors, value }:
 *   errors — array of human-readable strings, empty when valid
 *   value  — the whitelisted fields, so nothing else can be mass-assigned
 */

const isString = (v) => typeof v === "string" && v.trim().length > 0;

const validateRegister = (body = {}) => {
  const errors = [];
  // Keyed by field so the signup form can show each message under its input.
  // The flat `errors` array is kept alongside it because every existing form
  // (project, profile, comment) already renders that shape.
  const fields = {};
  const fail = (field, message) => {
    if (!fields[field]) fields[field] = message;
    errors.push(message);
  };

  const { name, username, email, password, confirmPassword, role } = body;

  if (!isString(name)) {
    fail("name", "Name is required");
  } else if (name.trim().length > 80) {
    fail("name", "Name cannot exceed 80 characters");
  }

  if (!isString(username)) {
    fail("username", "Username is required");
  } else if (!/^[a-zA-Z0-9_]{3,30}$/.test(username.trim())) {
    // Mirrors the User model's own regex — underscores but no hyphens.
    fail(
      "username",
      "Username must be 3-30 characters and contain only letters, numbers and underscores",
    );
  }

  if (!isString(email)) {
    fail("email", "Email is required");
  } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
    fail("email", "Please provide a valid email address");
  }

  if (!isString(password)) {
    fail("password", "Password is required");
  } else if (password.length < 8) {
    fail("password", "Password must be at least 8 characters");
  } else if (password.length > 128) {
    // bcrypt silently truncates beyond 72 bytes; cap well before that matters.
    fail("password", "Password cannot exceed 128 characters");
  }

  // Only checked when a value was supplied, so the endpoint stays usable by
  // API clients that post just email/username/password.
  if (confirmPassword !== undefined && confirmPassword !== password) {
    fail("confirmPassword", "Passwords do not match");
  }

  if (role !== undefined && !isString(role)) {
    fail("role", "Role must be a string");
  }

  // Only these five keys survive. A request sending isVerified, role: ADMIN,
  // followersCount or rating cannot reach the model through this path.
  return {
    errors,
    fields,
    value: {
      name: name?.trim(),
      username: username?.trim().toLowerCase(),
      email: email?.trim().toLowerCase(),
      password,
      role: role?.trim().toUpperCase(),
    },
  };
};

const validateLogin = (body = {}) => {
  const errors = [];
  const { email, password } = body;

  if (!isString(email)) errors.push("Email is required");
  if (!isString(password)) errors.push("Password is required");

  return {
    errors,
    value: { email: email?.trim().toLowerCase(), password },
  };
};

const { CATEGORIES, PROJECT_VISIBILITY, values } = require("./constants");

const SOCIAL_PLATFORMS = [
  "instagram",
  "behance",
  "dribbble",
  "twitter",
  "linkedin",
  "youtube",
  "tiktok",
];

const isHttpUrl = (v) => typeof v === "string" && /^https?:\/\/.+/i.test(v.trim());

/** Trim, drop blanks and de-duplicate a list of strings. */
const cleanStringList = (list) => [
  ...new Set(list.map((s) => String(s).trim()).filter(Boolean)),
];

/** True when any entry is longer than the limit — reported, never silently cut. */
const anyTooLong = (list, maxLength) =>
  list.some((s) => String(s).trim().length > maxLength);

/**
 * Validate a profile update.
 *
 * Only the keys actually present in the body are returned, so a PUT that sends
 * just `{ bio }` does not blank out every other field.
 *
 * Protected fields — _id, password, role, isActive, isVerified,
 * followersCount, followingCount, projectsCount, rating, reviewsCount — are
 * absent from this whitelist and therefore silently unreachable, no matter
 * what the client sends.
 */
const validateProfileUpdate = (body = {}) => {
  const errors = [];
  const value = {};

  if ("name" in body) {
    if (!isString(body.name)) errors.push("Name cannot be empty");
    else if (body.name.trim().length > 80)
      errors.push("Name cannot exceed 80 characters");
    else value.name = body.name.trim();
  }

  if ("username" in body) {
    if (!isString(body.username)) {
      errors.push("Username cannot be empty");
    } else if (!/^[a-zA-Z0-9_]{3,30}$/.test(body.username.trim())) {
      errors.push(
        "Username must be 3-30 characters and contain only letters, numbers and underscores",
      );
    } else {
      value.username = body.username.trim().toLowerCase();
    }
  }

  if ("bio" in body) {
    const bio = body.bio == null ? "" : String(body.bio);
    if (bio.length > 500) errors.push("Bio cannot exceed 500 characters");
    else value.bio = bio.trim();
  }

  if ("location" in body) {
    const location = body.location == null ? "" : String(body.location);
    if (location.length > 120)
      errors.push("Location cannot exceed 120 characters");
    else value.location = location.trim();
  }

  if ("website" in body) {
    const website = body.website == null ? "" : String(body.website).trim();
    if (website && !isHttpUrl(website))
      errors.push("Website must start with http:// or https://");
    else value.website = website;
  }

  if ("skills" in body) {
    if (!Array.isArray(body.skills)) {
      errors.push("Skills must be an array of strings");
    } else if (body.skills.length > 20) {
      errors.push("A user cannot have more than 20 skills");
    } else if (anyTooLong(body.skills, 40)) {
      errors.push("Each skill must be 40 characters or fewer");
    } else {
      value.skills = cleanStringList(body.skills);
    }
  }

  if ("categories" in body) {
    if (!Array.isArray(body.categories)) {
      errors.push("Categories must be an array");
    } else {
      const categories = body.categories.map((c) => String(c).trim().toUpperCase());
      const invalid = categories.filter((c) => !CATEGORIES.includes(c));
      if (invalid.length) {
        errors.push(
          `Invalid category: ${invalid.join(", ")}. Allowed: ${CATEGORIES.join(", ")}`,
        );
      } else if (categories.length > 5) {
        errors.push("A user cannot have more than 5 categories");
      } else {
        value.categories = [...new Set(categories)];
      }
    }
  }

  if ("avatar" in body) {
    const avatar = body.avatar;
    if (avatar === null) {
      value.avatar = undefined;
    } else if (!avatar || !isHttpUrl(avatar.url)) {
      errors.push("Avatar must be an object with a valid http(s) url");
    } else {
      value.avatar = { url: avatar.url.trim(), publicId: avatar.publicId };
    }
  }

  if ("socialLinks" in body) {
    const links = body.socialLinks;
    if (typeof links !== "object" || links === null || Array.isArray(links)) {
      errors.push("socialLinks must be an object");
    } else {
      const unknown = Object.keys(links).filter(
        (k) => !SOCIAL_PLATFORMS.includes(k),
      );
      if (unknown.length) {
        errors.push(
          `Unknown social platform: ${unknown.join(", ")}. Allowed: ${SOCIAL_PLATFORMS.join(", ")}`,
        );
      } else {
        const cleaned = {};
        for (const [platform, url] of Object.entries(links)) {
          const trimmed = url == null ? "" : String(url).trim();
          if (trimmed && !isHttpUrl(trimmed)) {
            errors.push(`${platform} link must start with http:// or https://`);
          } else {
            cleaned[platform] = trimmed;
          }
        }
        value.socialLinks = cleaned;
      }
    }
  }

  if (!errors.length && Object.keys(value).length === 0) {
    errors.push("No updatable fields were provided");
  }

  return { errors, value };
};

/** Normalise one media entry supplied as a plain URL or an object. */
const parseMediaItem = (item) => {
  if (typeof item === "string") return { url: item.trim() };
  if (item && typeof item === "object" && typeof item.url === "string") {
    return {
      url: item.url.trim(),
      publicId: item.publicId,
      resourceType: item.resourceType,
      width: item.width,
      height: item.height,
    };
  }
  return null;
};

/**
 * Validate a project create or update.
 *
 * `partial` mode is used by PUT: only the supplied keys are validated and
 * returned, so a partial update does not wipe untouched fields.
 * `owner`, likesCount, commentsCount, viewsCount and isFeatured are not in the
 * whitelist — ownership is taken from the token, never from the body.
 */
const validateProject = (body = {}, { partial = false } = {}) => {
  const errors = [];
  const value = {};
  const has = (key) => (partial ? key in body : true);

  if (has("title")) {
    if (!isString(body.title)) errors.push("Title is required");
    else if (body.title.trim().length > 120)
      errors.push("Title cannot exceed 120 characters");
    else value.title = body.title.trim();
  }

  if (has("description") && "description" in body) {
    const description = body.description == null ? "" : String(body.description);
    if (description.length > 5000)
      errors.push("Description cannot exceed 5000 characters");
    else value.description = description.trim();
  }

  if (has("category")) {
    const category = String(body.category ?? "").trim().toUpperCase();
    if (!category) errors.push("Category is required");
    else if (!CATEGORIES.includes(category))
      errors.push(
        `Invalid category: ${category}. Allowed: ${CATEGORIES.join(", ")}`,
      );
    else value.category = category;
  }

  if (has("media")) {
    if (!Array.isArray(body.media) || body.media.length === 0) {
      errors.push("At least one media item is required");
    } else if (body.media.length > 20) {
      errors.push("A project cannot have more than 20 media items");
    } else {
      const parsed = body.media.map(parseMediaItem);
      if (parsed.some((m) => !m || !isHttpUrl(m.url))) {
        errors.push("Every media item needs a valid http(s) url");
      } else {
        value.media = parsed;
      }
    }
  }

  if ("tags" in body) {
    if (!Array.isArray(body.tags)) errors.push("Tags must be an array");
    else if (body.tags.length > 15)
      errors.push("A project cannot have more than 15 tags");
    else if (anyTooLong(body.tags, 30))
      errors.push("Each tag must be 30 characters or fewer");
    else value.tags = cleanStringList(body.tags);
  }

  if ("tools" in body) {
    if (!Array.isArray(body.tools)) errors.push("Tools must be an array");
    else if (body.tools.length > 15)
      errors.push("A project cannot list more than 15 tools");
    else if (anyTooLong(body.tools, 40))
      errors.push("Each tool must be 40 characters or fewer");
    else value.tools = cleanStringList(body.tools);
  }

  if ("projectUrl" in body) {
    const url = body.projectUrl == null ? "" : String(body.projectUrl).trim();
    if (url && !isHttpUrl(url))
      errors.push("Project URL must start with http:// or https://");
    else value.projectUrl = url;
  }

  if ("visibility" in body) {
    const visibility = String(body.visibility).trim().toUpperCase();
    if (!values(PROJECT_VISIBILITY).includes(visibility))
      errors.push(
        `Invalid visibility. Allowed: ${values(PROJECT_VISIBILITY).join(", ")}`,
      );
    else value.visibility = visibility;
  }

  if ("collaborators" in body) {
    if (!Array.isArray(body.collaborators))
      errors.push("Collaborators must be an array of user ids");
    else value.collaborators = body.collaborators;
  }

  if (partial && !errors.length && Object.keys(value).length === 0) {
    errors.push("No updatable fields were provided");
  }

  return { errors, value };
};

const MAX_PAGE_SIZE = 48;
const DEFAULT_PAGE_SIZE = 12;

/**
 * Validate feed / explore query parameters.
 *
 * Everything is coerced and clamped rather than rejected, because a bad page
 * number in a URL should show page 1, not an error page. `category` is checked
 * against the existing enum and `search` is passed to MongoDB's $text operator
 * — never interpolated into a regex — so there is no injection surface.
 */
const validateFeedQuery = (query = {}) => {
  const errors = [];

  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE),
  );

  let category;
  if (query.category) {
    const candidate = String(query.category).trim().toUpperCase();
    if (!CATEGORIES.includes(candidate)) {
      errors.push(
        `Invalid category: ${candidate}. Allowed: ${CATEGORIES.join(", ")}`,
      );
    } else {
      category = candidate;
    }
  }

  const search = query.search ? String(query.search).trim().slice(0, 100) : "";

  return { errors, value: { page, limit, category, search } };
};

/** Validate a new comment. Author comes from the token, never the body. */
const validateComment = (body = {}) => {
  const errors = [];
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!content) errors.push("Comment cannot be empty");
  else if (content.length > 1000)
    errors.push("Comment cannot exceed 1000 characters");

  return { errors, value: { content } };
};

const { CURRENCIES, ORDER_STATUS } = require("./constants");

/**
 * Validate a marketplace service.
 *
 * `partial` mode is used by PUT so an update only touches the keys supplied.
 * `creator`, `ordersCount`, `rating` and `reviewsCount` are absent from the
 * whitelist — ownership comes from the token and the counters are maintained
 * by the server, never by the client.
 */
const validateService = (body = {}, { partial = false } = {}) => {
  const errors = [];
  const fields = {};
  const value = {};
  const fail = (field, message) => {
    if (!fields[field]) fields[field] = message;
    errors.push(message);
  };
  const has = (key) => (partial ? key in body : true);

  if (has("title")) {
    if (!isString(body.title)) fail("title", "Title is required");
    else if (body.title.trim().length > 120)
      fail("title", "Title cannot exceed 120 characters");
    else value.title = body.title.trim();
  }

  if (has("description")) {
    if (!isString(body.description))
      fail("description", "Description is required");
    else if (body.description.trim().length > 5000)
      fail("description", "Description cannot exceed 5000 characters");
    else value.description = body.description.trim();
  }

  if (has("category")) {
    const category = String(body.category ?? "").trim().toUpperCase();
    if (!category) fail("category", "Category is required");
    else if (!CATEGORIES.includes(category))
      fail(
        "category",
        `Invalid category: ${category}. Allowed: ${CATEGORIES.join(", ")}`,
      );
    else value.category = category;
  }

  if (has("price")) {
    // Minor units (kobo). A float here would be a rounding bug waiting to
    // happen and Paystack expects the minor unit anyway.
    const price = Number(body.price);
    if (body.price === undefined || body.price === null || body.price === "")
      fail("price", "Price is required");
    else if (!Number.isFinite(price) || !Number.isInteger(price))
      fail("price", "Price must be a whole number in the currency's minor unit");
    else if (price < 0) fail("price", "Price cannot be negative");
    else value.price = price;
  }

  if ("currency" in body) {
    const currency = String(body.currency).trim().toUpperCase();
    if (!CURRENCIES.includes(currency))
      fail(
        "currency",
        `Invalid currency. Allowed: ${CURRENCIES.join(", ")}`,
      );
    else value.currency = currency;
  }

  if (has("deliveryTime")) {
    const days = Number(body.deliveryTime);
    if (!Number.isInteger(days))
      fail("deliveryTime", "Delivery time must be a whole number of days");
    else if (days < 1 || days > 365)
      fail("deliveryTime", "Delivery time must be between 1 and 365 days");
    else value.deliveryTime = days;
  }

  if ("deliverables" in body) {
    if (!Array.isArray(body.deliverables))
      fail("deliverables", "Deliverables must be an array");
    else if (body.deliverables.length > 10)
      fail("deliverables", "A service cannot list more than 10 deliverables");
    else if (anyTooLong(body.deliverables, 120))
      fail("deliverables", "Each deliverable must be 120 characters or fewer");
    else value.deliverables = cleanStringList(body.deliverables);
  }

  if ("media" in body) {
    if (!Array.isArray(body.media)) fail("media", "Media must be an array");
    else if (body.media.length > 10)
      fail("media", "A service cannot have more than 10 media items");
    else {
      const parsed = body.media.map(parseMediaItem);
      if (parsed.some((m) => !m || !isHttpUrl(m.url)))
        fail("media", "Every media item needs a valid http(s) url");
      else value.media = parsed;
    }
  }

  // Only meaningful on update — this is how a deactivated service is relisted.
  if ("isActive" in body) {
    if (typeof body.isActive !== "boolean")
      fail("isActive", "isActive must be true or false");
    else value.isActive = body.isActive;
  }

  if (partial && !errors.length && Object.keys(value).length === 0) {
    fail("form", "No updatable fields were provided");
  }

  return { errors, fields, value };
};

/**
 * Validate an order request.
 *
 * Only the service and the buyer's requirements are accepted. Price, currency,
 * creative and client are all derived server-side — see order.service.
 */
const validateOrder = (body = {}) => {
  const errors = [];
  const fields = {};

  const serviceId = body.service ?? body.serviceId;
  if (!isString(serviceId)) {
    fields.service = "A service is required";
    errors.push("A service is required");
  }

  const requirements =
    body.requirements == null ? "" : String(body.requirements).trim();
  if (requirements.length > 2000) {
    fields.requirements = "Requirements cannot exceed 2000 characters";
    errors.push("Requirements cannot exceed 2000 characters");
  }

  return {
    errors,
    fields,
    value: { serviceId: isString(serviceId) ? serviceId.trim() : "", requirements },
  };
};

/** Validate a requested order-status transition. */
const validateOrderStatus = (body = {}) => {
  const errors = [];
  const fields = {};
  const status = String(body.status ?? "").trim().toUpperCase();

  if (!status) {
    fields.status = "A status is required";
    errors.push("A status is required");
  } else if (!values(ORDER_STATUS).includes(status)) {
    const message = `Invalid status. Allowed: ${values(ORDER_STATUS).join(", ")}`;
    fields.status = message;
    errors.push(message);
  }

  return { errors, fields, value: { status } };
};

const {
  COLLABORATION_STATUS,
  APPLICATION_STATUS,
} = require("./constants");

/**
 * Normalise the budget.
 *
 * The schema stores `{ min, max, currency }` in the currency's minor unit. A
 * plain number is accepted as a convenience and read as a fixed budget, so
 * `budget: 250000` and `budget: { min: 250000, max: 250000 }` mean the same
 * thing. Returns `{ value, error }`.
 */
const parseBudget = (budget) => {
  if (budget === null || budget === "") return { value: undefined };

  if (typeof budget === "number" || typeof budget === "string") {
    const fixed = Number(budget);
    if (!Number.isInteger(fixed) || fixed < 0) {
      return { error: "Budget must be a whole number in the currency's minor unit" };
    }
    return { value: { min: fixed, max: fixed } };
  }

  if (typeof budget !== "object" || Array.isArray(budget)) {
    return { error: "Budget must be a number or { min, max, currency }" };
  }

  const value = {};
  for (const bound of ["min", "max"]) {
    if (budget[bound] === undefined || budget[bound] === null || budget[bound] === "")
      continue;
    const amount = Number(budget[bound]);
    if (!Number.isInteger(amount) || amount < 0) {
      return {
        error: `Budget ${bound} must be a whole number in the currency's minor unit`,
      };
    }
    value[bound] = amount;
  }

  if (budget.currency) {
    const currency = String(budget.currency).trim().toUpperCase();
    if (!CURRENCIES.includes(currency)) {
      return { error: `Invalid currency. Allowed: ${CURRENCIES.join(", ")}` };
    }
    value.currency = currency;
  }

  if (value.min != null && value.max != null && value.max < value.min) {
    return { error: "Budget max cannot be less than budget min" };
  }

  return { value: Object.keys(value).length ? value : undefined };
};

/**
 * Validate a collaboration opportunity.
 *
 * `creator`, `applicationsCount` and the timestamps are absent from the
 * whitelist — ownership comes from the token and the counter is the server's.
 */
const validateCollaboration = (body = {}, { partial = false } = {}) => {
  const errors = [];
  const fields = {};
  const value = {};
  const fail = (field, message) => {
    if (!fields[field]) fields[field] = message;
    errors.push(message);
  };
  const has = (key) => (partial ? key in body : true);

  if (has("title")) {
    if (!isString(body.title)) fail("title", "Title is required");
    else if (body.title.trim().length > 120)
      fail("title", "Title cannot exceed 120 characters");
    else value.title = body.title.trim();
  }

  if (has("description")) {
    if (!isString(body.description))
      fail("description", "Description is required");
    else if (body.description.trim().length > 5000)
      fail("description", "Description cannot exceed 5000 characters");
    else value.description = body.description.trim();
  }

  if (has("category")) {
    const category = String(body.category ?? "").trim().toUpperCase();
    if (!category) fail("category", "Category is required");
    else if (!CATEGORIES.includes(category))
      fail("category", `Invalid category: ${category}. Allowed: ${CATEGORIES.join(", ")}`);
    else value.category = category;
  }

  if ("location" in body) {
    const location = body.location == null ? "" : String(body.location).trim();
    if (location.length > 120)
      fail("location", "Location cannot exceed 120 characters");
    else value.location = location;
  }

  if ("isRemote" in body) {
    if (typeof body.isRemote !== "boolean")
      fail("isRemote", "isRemote must be true or false");
    else value.isRemote = body.isRemote;
  }

  if ("budget" in body) {
    const { value: budget, error } = parseBudget(body.budget);
    if (error) fail("budget", error);
    else if (budget) value.budget = budget;
  }

  if ("deadline" in body) {
    if (body.deadline === null || body.deadline === "") {
      value.deadline = undefined;
    } else {
      const deadline = new Date(body.deadline);
      if (Number.isNaN(deadline.getTime()))
        fail("deadline", "Deadline must be a valid date");
      else value.deadline = deadline;
    }
  }

  // Only meaningful on update — this is how an opportunity is closed.
  if ("status" in body) {
    const status = String(body.status).trim().toUpperCase();
    if (!values(COLLABORATION_STATUS).includes(status))
      fail(
        "status",
        `Invalid status. Allowed: ${values(COLLABORATION_STATUS).join(", ")}`,
      );
    else value.status = status;
  }

  if (partial && !errors.length && Object.keys(value).length === 0) {
    fail("form", "No updatable fields were provided");
  }

  return { errors, fields, value };
};

/** Validate an application. The applicant comes from the token, never the body. */
const validateApplication = (body = {}) => {
  const errors = [];
  const fields = {};
  const value = {};

  if (!isString(body.message)) {
    fail_(fields, errors, "message", "An application message is required");
  } else if (body.message.trim().length > 2000) {
    fail_(fields, errors, "message", "Message cannot exceed 2000 characters");
  } else {
    value.message = body.message.trim();
  }

  if ("portfolioProjects" in body) {
    if (!Array.isArray(body.portfolioProjects)) {
      fail_(fields, errors, "portfolioProjects", "portfolioProjects must be an array");
    } else if (body.portfolioProjects.length > 10) {
      fail_(fields, errors, "portfolioProjects", "You can attach at most 10 projects");
    } else {
      value.portfolioProjects = body.portfolioProjects;
    }
  }

  return { errors, fields, value };
};

/** Shared helper for the two validators above. */
function fail_(fields, errors, field, message) {
  if (!fields[field]) fields[field] = message;
  errors.push(message);
}

/**
 * Validate a response to an application.
 * Only the two decisions a creator can make are accepted here; the service
 * enforces which transitions are legal from the current state.
 */
const validateApplicationStatus = (body = {}) => {
  const errors = [];
  const fields = {};
  const status = String(body.status ?? "").trim().toUpperCase();
  const allowed = [APPLICATION_STATUS.ACCEPTED, APPLICATION_STATUS.REJECTED];

  if (!status) {
    fail_(fields, errors, "status", "A status is required");
  } else if (!allowed.includes(status)) {
    fail_(
      fields,
      errors,
      "status",
      `Invalid status. Allowed: ${allowed.join(", ")}`,
    );
  }

  return { errors, fields, value: { status } };
};

// ORDER_STATUS, CATEGORIES, COLLABORATION_STATUS and values() are already
// imported higher up in this file; only the two new names are pulled in here.
const { USER_ROLES, PAYMENT_STATUS } = require("./constants");

/**
 * Escape every regex metacharacter in a user-supplied search term.
 *
 * Admin search has to match partial emails, which the $text index does not
 * cover, so it falls back to a regex. Passing raw input to `new RegExp` would
 * let a query change its own meaning — and a pattern like `(a+)+$` would hang
 * the server. Callers must run every search term through this.
 */
const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Validate an admin list query.
 *
 * Every filter is checked against a fixed set of allowed values and rebuilt
 * from scratch, so nothing a client sends can reach MongoDB as an operator —
 * `?role[$ne]=ADMIN` arrives as an object, fails the enum check, and is
 * dropped rather than becoming part of the query.
 */
const validateAdminQuery = (query = {}, { allow = [] } = {}) => {
  const errors = [];
  const value = {};

  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(query.limit, 10) || 20),
  );
  value.page = page;
  value.limit = limit;

  // Only ever a trimmed, length-capped string; escaped at the point of use.
  value.search =
    typeof query.search === "string" ? query.search.trim().slice(0, 100) : "";

  if (allow.includes("role") && query.role !== undefined) {
    const role = String(query.role).trim().toUpperCase();
    if (!values(USER_ROLES).includes(role)) {
      errors.push(`Invalid role. Allowed: ${values(USER_ROLES).join(", ")}`);
    } else {
      value.role = role;
    }
  }

  if (allow.includes("isActive") && query.isActive !== undefined) {
    const raw = String(query.isActive).trim().toLowerCase();
    if (raw !== "true" && raw !== "false") {
      errors.push("isActive must be true or false");
    } else {
      value.isActive = raw === "true";
    }
  }

  if (allow.includes("category") && query.category !== undefined) {
    const category = String(query.category).trim().toUpperCase();
    if (!CATEGORIES.includes(category)) {
      errors.push(`Invalid category. Allowed: ${CATEGORIES.join(", ")}`);
    } else {
      value.category = category;
    }
  }

  if (allow.includes("status") && query.status !== undefined) {
    const status = String(query.status).trim().toUpperCase();
    const allowed = allow.includes("collaborationStatus")
      ? values(COLLABORATION_STATUS)
      : values(ORDER_STATUS);
    if (!allowed.includes(status)) {
      errors.push(`Invalid status. Allowed: ${allowed.join(", ")}`);
    } else {
      value.status = status;
    }
  }

  if (allow.includes("paymentStatus") && query.paymentStatus !== undefined) {
    const paymentStatus = String(query.paymentStatus).trim().toUpperCase();
    if (!values(PAYMENT_STATUS).includes(paymentStatus)) {
      errors.push(
        `Invalid paymentStatus. Allowed: ${values(PAYMENT_STATUS).join(", ")}`,
      );
    } else {
      value.paymentStatus = paymentStatus;
    }
  }

  return { errors, value };
};

/**
 * Validate an account status change.
 * Deliberately narrow: `isActive` is the only field this endpoint accepts, so
 * a role or verification flag cannot ride along in the same request.
 */
const validateUserStatus = (body = {}) => {
  const errors = [];
  if (typeof body.isActive !== "boolean") {
    errors.push("isActive must be true or false");
  }
  return { errors, value: { isActive: body.isActive } };
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateProject,
  validateFeedQuery,
  validateComment,
  validateService,
  validateOrder,
  validateOrderStatus,
  validateCollaboration,
  validateApplication,
  validateApplicationStatus,
  validateAdminQuery,
  validateUserStatus,
  escapeRegex,
  SOCIAL_PLATFORMS,
  MAX_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
};
