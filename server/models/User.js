const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const mediaSchema = require("./media.schema");
const { USER_ROLES, CATEGORIES, values } = require("../utils/constants");

/** bcrypt work factor. 12 is a deliberate cost — raising it slows attackers. */
const SALT_ROUNDS = 12;

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
      // .select("+password"). Stored only as a bcrypt hash — see the pre-save
      // hook below. The minlength above is checked against the plaintext,
      // because validation runs before save hooks.
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

/**
 * Hash the password whenever it is set or changed.
 *
 * Living on the model rather than in a controller means every write path —
 * register, the seed script, a future password reset, an admin script — is
 * hashed automatically. There is no route through which a plaintext password
 * can reach the database.
 *
 * `isModified` guards against re-hashing an already-hashed value on unrelated
 * saves (e.g. updating a bio), which would lock the user out.
 *
 * Note: Mongoose 9 removed the `next` callback from document middleware, so
 * this is an async function that simply returns.
 */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

/**
 * Compare a plaintext candidate against the stored hash.
 * Requires the document to have been loaded with .select("+password").
 */
userSchema.methods.comparePassword = function (candidatePassword) {
  if (!this.password) {
    throw new Error(
      'Password not loaded — query the user with .select("+password")',
    );
  }
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
