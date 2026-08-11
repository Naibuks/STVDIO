/**
 * Single entry point for the data layer.
 *
 * Requiring this file registers every model with Mongoose, so controllers can
 * do `const { User, Project } = require("../models")` and `populate()` always
 * resolves — even for a model no controller imported directly.
 */

module.exports = {
  User: require("./User"),
  Project: require("./Project"),
  Comment: require("./Comment"),
  Like: require("./Like"),
  Follow: require("./Follow"),
  Service: require("./Service"),
  Order: require("./Order"),
  Payment: require("./Payment"),
  Collaboration: require("./Collaboration"),
  CollaborationApplication: require("./CollaborationApplication"),
  Conversation: require("./Conversation"),
  Message: require("./Message"),
  Notification: require("./Notification"),
  Review: require("./Review"),
};
