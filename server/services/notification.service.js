const { Notification } = require("../models");

/**
 * In-app notifications.
 *
 * The Notification model has existed since Phase 2 but nothing wrote to it
 * until now; this is the first writer. Kept deliberately small — one create
 * function — so later phases can reuse it without inheriting a framework.
 *
 * Separate from email: a notification is a row users see inside STVDIO°, an
 * email leaves the building. Some events produce both.
 */

/**
 * Record a notification.
 *
 * Never throws. A notification is a side effect of a business event, and a
 * failure to write one must not roll back the application or the acceptance
 * that caused it — the same rule Phase 8 applies to email.
 *
 * Self-notifications are skipped: telling someone about their own click is
 * noise, and it is easier to guard here than at every call site.
 */
const notify = async ({
  recipient,
  actor,
  type,
  message,
  relatedId,
  relatedModel,
}) => {
  try {
    if (!recipient) return null;

    const recipientId = recipient._id ?? recipient;
    const actorId = actor?._id ?? actor;

    if (actorId && recipientId.toString() === actorId.toString()) return null;

    return await Notification.create({
      recipient: recipientId,
      actor: actorId,
      type,
      message,
      relatedId,
      relatedModel,
    });
  } catch (error) {
    console.error(`[notification] "${type}" failed: ${error.message}`);
    return null;
  }
};

module.exports = { notify };
