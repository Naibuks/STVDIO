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

module.exports = { validateRegister, validateLogin };
