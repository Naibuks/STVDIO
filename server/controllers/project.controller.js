const projectService = require("../services/project.service");
const { isLikedBy } = require("../services/like.service");
const ApiError = require("../utils/ApiError");
const { validateProject } = require("../utils/validators");

/** POST /api/projects */
const createProject = async (req, res) => {
  const { errors, value } = validateProject(req.body);
  if (errors.length) throw ApiError.badRequest("Validation failed", errors);

  const project = await projectService.create(req.user._id, value);

  res.status(201).json({
    success: true,
    message: "Project created",
    data: { project },
  });
};

/** GET /api/projects/my — the caller's own projects, private ones included. */
const getMyProjects = async (req, res) => {
  const projects = await projectService.listOwn(req.user._id);

  res.json({
    success: true,
    message: "Projects retrieved",
    data: { projects, count: projects.length },
  });
};

/** GET /api/projects/:id */
const getProject = async (req, res) => {
  const { project, isOwner } = await projectService.getById(
    req.params.id,
    req.user,
  );

  // Without this the detail page's like button renders unliked for someone who
  // has already liked the project, and their click fails with a 409.
  const likedByMe = await isLikedBy(project._id, req.user);

  res.json({
    success: true,
    message: "Project retrieved",
    data: { project: { ...project.toJSON(), likedByMe }, isOwner },
  });
};

/** PUT /api/projects/:id — owner or admin only. */
const updateProject = async (req, res) => {
  const { errors, value } = validateProject(req.body, { partial: true });
  if (errors.length) throw ApiError.badRequest("Validation failed", errors);

  const project = await projectService.update(req.params.id, req.user, value);

  res.json({
    success: true,
    message: "Project updated",
    data: { project },
  });
};

/** DELETE /api/projects/:id — owner or admin only. */
const deleteProject = async (req, res) => {
  await projectService.remove(req.params.id, req.user);

  res.json({
    success: true,
    message: "Project deleted",
    data: null,
  });
};

module.exports = {
  createProject,
  getMyProjects,
  getProject,
  updateProject,
  deleteProject,
};
