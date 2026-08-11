const feedService = require("../services/feed.service");
const ApiError = require("../utils/ApiError");
const { validateFeedQuery } = require("../utils/validators");

/** GET /api/feed — public projects, newest first, paginated. */
const getFeed = async (req, res) => {
  const { errors, value } = validateFeedQuery(req.query);
  if (errors.length) throw ApiError.badRequest("Invalid query", errors);

  const result = await feedService.getFeed(value, req.user);

  res.json({
    success: true,
    message: "Feed retrieved",
    data: result,
  });
};

/** GET /api/feed/creatives — active users to discover. */
const getCreatives = async (req, res) => {
  const { errors, value } = validateFeedQuery(req.query);
  if (errors.length) throw ApiError.badRequest("Invalid query", errors);

  const result = await feedService.getCreatives(value, req.user);

  res.json({
    success: true,
    message: "Creatives retrieved",
    data: result,
  });
};

module.exports = { getFeed, getCreatives };
