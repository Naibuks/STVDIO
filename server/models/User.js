const mongoose = require("mongoose");
const mediaSchema = require("./media.schema");
const { USER_ROLES, CATEGORIES, values } = require("../utils/constants");

const socialLinksSchema = new mongoose.Schema(
  {
    instagram: String,
    behance: String,
    dribbble: String,
    twitter: String,
    linkedin: String,
    youtube: String,
    tiktok: String,
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [80, "Name cannot exceed 80 characters"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      // Letters, numbers, underscore — safe in a profile URL like /@username
      match: [
        /^[a-z0-9_]+$/,
        "Username may only contain letters, numbers and underscores",
      ],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      // Never returned by a query unless explicitly asked for with
      // .select("+password"). Hashing is added in Phase 3 (Authentication) —
      // this field currently stores whatever it is given.
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: values(USER_ROLES),
        message: "{VALUE} is not a valid role",
      },
      default: USER_ROLES.CREATIVE,
    },
    avatar: mediaSchema,
    coverImage: mediaSchema,
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [120, "Location cannot exceed 120 characters"],
    },
    /** Free-text abilities, e.g. "Retouching", "Art direction". */
    skills: {
      type: [String],
      default: [],
      validate: {
        validator: (skills) => skills.length <= 20,
        message: "A user cannot have more than 20 skills",
      },
    },
    /** Constrained disciplines, used for discovery and filtering. */
    categories: {
      type: [String],
      enum: {
        values: CATEGORIES,
        message: "{VALUE} is not a valid category",
      },
      default: [],
    },
    website: {
      type: String,
      trim: true,
    },
    socialLinks: {
      type: socialLinksSchema,
      default: () => ({}),
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Denormalised counters. The Follow / Project collections remain the source
    // of truth; these exist so profiles and feeds can sort and display totals
    // without an aggregation on every request. Maintained from Phase 5 onward.
    followersCount: { type: Number, default: 0, min: 0 },
    followingCount: { type: Number, default: 0, min: 0 },
    projectsCount: { type: Number, default: 0, min: 0 },
    /** Rolling average of Review ratings, 0 when never reviewed. */
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// One combined text index per collection is a MongoDB limit, so all searchable
// profile fields go into this one. Powers user search in Phase 5.
userSchema.index({ name: "text", username: "text", bio: "text", skills: "text" });
userSchema.index({ categories: 1 });
userSchema.index({ createdAt: -1 });

/** Profile URL slug, e.g. /@ada. Not persisted. */
userSchema.virtual("profilePath").get(function () {
  return `/@${this.username}`;
});

module.exports = mongoose.model("User", userSchema);
