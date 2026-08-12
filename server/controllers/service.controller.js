const marketplaceService = require("../services/marketplace.service");
const ApiError = require("../utils/ApiError");
const { validateService, validateFeedQuery } = require("../utils/validators");

/** GET /api/services — public marketplace, active listings only. */
const browseServices = async (req, res) => {
  const { errors, value } = validateFeedQuery(req.query);
  if (errors.length) throw ApiError.badRequest("Invalid query", errors);

  const result = await marketplaceService.browse({
    ...value,
    sort: req.query.sort,
  });

  res.json({ success: true, message: "Services retrieved", data: result });
};

/** GET /api/services/mine — the caller's listings, deactivated ones included. */
const getMyServices = async (req, res) => {
  const services = await marketplaceService.listOwn(req.user._id);

  res.json({
    success: true,
    message: "Services retrieved",
    data: { services, count: services.length },
  });
};

/** GET /api/services/:id */
const getService = async (req, res) => {
  const { service, isOwner } = await marketplaceService.getById(
    req.params.id,
    req.user,
  );

  res.json({
    success: true,
    message: "Service retrieved",
    data: { service, isOwner },
  });
};

/** POST /api/services */
const createService = async (req, res) => {
  const { errors, fields, value } = validateService(req.body);
  if (errors.length) throw ApiError.badRequest("Validation failed", errors, fields);

  const service = await marketplaceService.create(req.user._id, value);

  res.status(201).json({
    success: true,
    message: "Service published",
    data: { service },
  });
};

/** PUT /api/services/:id — owner or admin only. */
const updateService = async (req, res) => {
  const { errors, fields, value } = validateService(req.body, { partial: true });
  if (errors.length) throw ApiError.badRequest("Validation failed", errors, fields);

  const service = await marketplaceService.update(
    req.params.id,
    req.user,
    value,
  );

  res.json({ success: true, message: "Service updated", data: { service } });
};

/**
 * DELETE /api/services/:id — deactivates rather than destroys.
 * Orders reference the service, so removing the document would orphan them.
 */
const deactivateService = async (req, res) => {
  const service = await marketplaceService.deactivate(req.params.id, req.user);

  res.json({
    success: true,
    message: "Service deactivated and removed from the marketplace",
    data: { service },
  });
};

module.exports = {
  browseServices,
  getMyServices,
  getService,
  createService,
  updateService,
  deactivateService,
};
