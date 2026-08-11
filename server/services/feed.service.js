const { Project, User, Like } = require("../models");
const { PROJECT_VISIBILITY } = require("../utils/constants");

const OWNER_FIELDS = "name username avatar role isVerified";
const CREATIVE_FIELDS =
  "name username avatar role bio location categories isVerified followersCount projectsCount";

/**
 * Tell the viewer which of these projects they have already liked.
 *
 * One extra query for the whole page rather than one per card — without this
 * a 12-item feed would issue 12 additional round trips. Returns a Set of
 * project id strings; empty for anonymous viewers.
 */
const likedProjectIds = async (projects, viewer) => {
  if (!viewer || projects.length === 0) return new Set();

  const likes = await Like.find({
    user: viewer._id,
    project: { $in: projects.map((p) => p._id) },
  })
    .select("project")
    .lean();

  return new Set(likes.map((like) => like.project.toString()));
};

/** Attach `likedByMe` to each project without mutating the Mongoose document. */
const withLikeState = async (projects, viewer) => {
  const liked = await likedProjectIds(projects, viewer);
  return projects.map((project) => ({
    ...project.toJSON(),
    likedByMe: liked.has(project._id.toString()),
  }));
};

/**
 * The public feed.
 *
 * Hard-filters to visibility PUBLIC. A viewer's own PRIVATE and UNLISTED work
 * is deliberately excluded even from their own feed — the owner-specific
 * endpoints (/projects/my, /users/:username/projects) are where that belongs,
 * so the feed can never become a leak path.
 */
const getFeed = async ({ page, limit, category, search }, viewer) => {
  const filter = { visibility: PROJECT_VISIBILITY.PUBLIC };
  if (category) filter.category = category;
  // $text uses the index Phase 2 created on title/description/tags. The term is
  // passed as data, never interpolated into a regex.
  if (search) filter.$text = { $search: search };

  const skip = (page - 1) * limit;

  // Relevance first when searching, otherwise newest first.
  const sort = search
    ? { score: { $meta: "textScore" }, createdAt: -1 }
    : { createdAt: -1 };

  const query = Project.find(filter);
  if (search) query.select({ score: { $meta: "textScore" } });

  const [projects, total] = await Promise.all([
    query.sort(sort).skip(skip).limit(limit).populate("owner", OWNER_FIELDS),
    Project.countDocuments(filter),
  ]);

  return {
    projects: await withLikeState(projects, viewer),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasMore: skip + projects.length < total,
  };
};

/**
 * Creatives to discover — active accounts only, most-followed first.
 * Never returns email: the field list is an allowlist.
 */
const getCreatives = async ({ page, limit, category, search }, viewer) => {
  const filter = { isActive: true };
  if (category) filter.categories = category;
  if (search) filter.$text = { $search: search };

  // Don't suggest the viewer to themselves.
  if (viewer) filter._id = { $ne: viewer._id };

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select(CREATIVE_FIELDS)
      .sort(search ? { score: { $meta: "textScore" } } : { followersCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    users,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasMore: skip + users.length < total,
  };
};

module.exports = { getFeed, getCreatives, withLikeState, OWNER_FIELDS };
