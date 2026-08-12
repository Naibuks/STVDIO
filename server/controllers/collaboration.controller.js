const collaborationService = require("../services/collaboration.service");
const ApiError = require("../utils/ApiError");
const {
  validateCollaboration,
  validateApplication,
  validateApplicationStatus,
  validateFeedQuery,
} = require("../utils/validators");
const { COLLABORATION_STATUS, values } = require("../utils/constants");

/** GET /api/collaborations — public opportunity board. */
const browseCollaborations = async (req, res) => {
  const { errors, value } = validateFeedQuery(req.query);
  if (errors.length) throw ApiError.badRequest("Invalid query", errors);

  const status = req.query.status
    ? String(req.query.status).trim().toUpperCase()
    : undefined;
  if (status && !values(COLLABORATION_STATUS).includes(status)) {
    throw ApiError.badRequest(
      `Invalid status. Allowed: ${values(COLLABORATION_STATUS).join(", ")}`,
    );
  }

  const result = await collaborationService.browse({
    ...value,
    status,
    location: req.query.location,
  });

  res.json({ success: true, message: "Collaborations retrieved", data: result });
};

/** GET /api/collaborations/mine — the caller's own opportunities, any state. */
const getMyCollaborations = async (req, res) => {
  const collaborations = await collaborationService.listOwn(req.user._id);
  res.json({
    success: true,
    message: "Collaborations retrieved",
    data: { collaborations, count: collaborations.length },
  });
};

/** GET /api/collaborations/mine/applications — applications the caller sent. */
const getMyApplications = async (req, res) => {
  const applications = await collaborationService.listOwnApplications(
    req.user._id,
  );
  res.json({
    success: true,
    message: "Applications retrieved",
    data: { applications, count: applications.length },
  });
};

/** GET /api/collaborations/:id */
const getCollaboration = async (req, res) => {
  const { collaboration, isOwner, myApplication } =
    await collaborationService.getById(req.params.id, req.user);

  res.json({
    success: true,
    message: "Collaboration retrieved",
    data: { collaboration, isOwner, myApplication },
  });
};

/** POST /api/collaborations */
const createCollaboration = async (req, res) => {
  const { errors, fields, value } = validateCollaboration(req.body);
  if (errors.length) throw ApiError.badRequest("Validation failed", errors, fields);

  const collaboration = await collaborationService.create(req.user._id, value);

  res.status(201).json({
    success: true,
    message: "Collaboration posted",
    data: { collaboration },
  });
};

/** PATCH /api/collaborations/:id — creator or admin. Also used to close it. */
const updateCollaboration = async (req, res) => {
  const { errors, fields, value } = validateCollaboration(req.body, {
    partial: true,
  });
  if (errors.length) throw ApiError.badRequest("Validation failed", errors, fields);

  const collaboration = await collaborationService.update(
    req.params.id,
    req.user,
    value,
  );

  res.json({
    success: true,
    message: "Collaboration updated",
    data: { collaboration },
  });
};

/** DELETE /api/collaborations/:id — creator or admin. */
const deleteCollaboration = async (req, res) => {
  const result = await collaborationService.remove(req.params.id, req.user);
  res.json({
    success: true,
    message: "Collaboration deleted",
    data: result,
  });
};

/** POST /api/collaborations/:id/applications */
const applyToCollaboration = async (req, res) => {
  const { errors, fields, value } = validateApplication(req.body);
  if (errors.length) throw ApiError.badRequest("Validation failed", errors, fields);

  const application = await collaborationService.apply(
    req.params.id,
    req.user,
    value,
  );

  res.status(201).json({
    success: true,
    message: "Application submitted",
    data: { application },
  });
};

/** GET /api/collaborations/:id/applications — creator only. */
const getApplications = async (req, res) => {
  const { collaboration, applications } =
    await collaborationService.listApplications(req.params.id, req.user, {
      status: req.query.status
        ? String(req.query.status).trim().toUpperCase()
        : undefined,
    });

  res.json({
    success: true,
    message: "Applications retrieved",
    data: {
      collaboration: {
        _id: collaboration._id,
        title: collaboration.title,
        status: collaboration.status,
      },
      applications,
      count: applications.length,
    },
  });
};

/** PATCH /api/collaborations/:id/applications/:applicationId — creator only. */
const respondToApplication = async (req, res) => {
  const { errors, fields, value } = validateApplicationStatus(req.body);
  if (errors.length) throw ApiError.badRequest("Validation failed", errors, fields);

  const application = await collaborationService.respondToApplication(
    req.params.id,
    req.params.applicationId,
    req.user,
    value.status,
  );

  res.json({
    success: true,
    message: `Application ${value.status.toLowerCase()}`,
    data: { application },
  });
};

module.exports = {
  browseCollaborations,
  getMyCollaborations,
  getMyApplications,
  getCollaboration,
  createCollaboration,
  updateCollaboration,
  deleteCollaboration,
  applyToCollaboration,
  getApplications,
  respondToApplication,
};
