const mongoose = require("mongoose");
const mediaSchema = require("./media.schema");
const {
  CATEGORIES,
  PROJECT_VISIBILITY,
  values,
} = require("../utils/constants");

/**
 * A piece of creative work shown on a profile and in the feed.
 */
const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    /** At least one image or video — a project with no media has nothing to show. */
    media: {
      type: [mediaSchema],
      validate: {
        validator: (media) => media.length > 0 && media.length <= 20,
        message: "A project needs between 1 and 20 media items",
      },
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: CATEGORIES,
        message: "{VALUE} is not a valid category",
      },
    },
    tags: {
      type: [String],
      default: [],
      // Lowercased so "#Editorial" and "#editorial" are the same tag.
      set: (tags) => tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean),
      validate: {
        validator: (tags) => tags.length <= 15,
        message: "A project cannot have more than 15 tags",
      },
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
    /** Other users credited on the work. Never includes the owner. */
    collaborators: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    /** Software and equipment used, e.g. "Figma", "Hasselblad 500CM". */
    tools: {
      type: [String],
      default: [],
      validate: {
        validator: (tools) => tools.length <= 15,
        message: "A project cannot list more than 15 tools",
      },
    },
    /** Where the work lives publicly — a live site, Behance post, film. */
    projectUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/i, "Project URL must start with http:// or https://"],
    },
    visibility: {
      type: String,
      enum: {
        values: values(PROJECT_VISIBILITY),
        message: "{VALUE} is not a valid visibility",
      },
      default: PROJECT_VISIBILITY.PUBLIC,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },

    // Counters, not sources of truth. Actual likes and comments live in their
    // own collections; these are maintained alongside them from Phase 5.
    likesCount: { type: Number, default: 0, min: 0 },
    commentsCount: { type: Number, default: 0, min: 0 },
    viewsCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

/**
 * The first media item doubles as the cover image. Kept as a virtual rather
 * than a separate stored field so the cover can never drift out of sync with
 * the media array, and so reordering media reorders the cover for free.
 */
projectSchema.virtual("coverImage").get(function () {
  return this.media?.[0] ?? null;
});

projectSchema.index({ title: "text", description: "text", tags: "text" });
// Compound indexes ordered to match how the feed queries: filter, then sort.
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ visibility: 1, createdAt: -1 });
projectSchema.index({ category: 1, createdAt: -1 });
projectSchema.index({ visibility: 1, likesCount: -1 });

/** A project cannot credit its own owner as a collaborator. */
projectSchema.pre("validate", function () {
  if (this.owner && this.collaborators?.length) {
    this.collaborators = this.collaborators.filter(
      (id) => !id.equals(this.owner),
    );
  }
});

module.exports = mongoose.model("Project", projectSchema);
