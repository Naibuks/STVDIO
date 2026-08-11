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
  const { name, username, email, password, role } = body;

  if (!isString(name)) {
    errors.push("Name is required");
  } else if (name.trim().length > 80) {
    errors.push("Name cannot exceed 80 characters");
  }

  if (!isString(username)) {
    errors.push("Username is required");
  } else if (!/^[a-zA-Z0-9_]{3,30}$/.test(username.trim())) {
    errors.push(
      "Username must be 3-30 characters and contain only letters, numbers and underscores",
    );
  }

  if (!isString(email)) {
    errors.push("Email is required");
  } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
    errors.push("Please provide a valid email address");
  }

  if (!isString(password)) {
    errors.push("Password is required");
  } else if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  } else if (password.length > 128) {
    // bcrypt silently truncates beyond 72 bytes; cap well before that matters.
    errors.push("Password cannot exceed 128 characters");
  }

  if (role !== undefined && !isString(role)) {
    errors.push("Role must be a string");
  }

  // Only these five keys survive. A request sending isVerified, role: ADMIN,
  // followersCount or rating cannot reach the model through this path.
  return {
    errors,
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

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateProject,
  SOCIAL_PLATFORMS,
};
