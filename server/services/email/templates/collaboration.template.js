const {
  layout,
  paragraph,
  detailTable,
  button,
  sanitizeHeader,
} = require("./layout");

/**
 * Collaboration notification.
 *
 * INFRASTRUCTURE ONLY — nothing calls this yet. The Collaboration and
 * CollaborationApplication models exist from Phase 2, but there is no
 * controller, route or service for them; that is Phase 9. This template is
 * here so Phase 9 has an email path ready and does not need to touch the
 * email service at all.
 *
 * Written against the fields already on those models — title, category,
 * location and application status — so it will not need reshaping later.
 */
module.exports = ({
  recipientName,
  actorName,
  collaboration,
  kind = "APPLICATION",
  clientUrl,
}) => {
  const headings = {
    APPLICATION: "New application",
    ACCEPTED: "Your application was accepted",
    REJECTED: "Update on your application",
  };

  const openings = {
    APPLICATION: `${actorName} applied to your collaboration.`,
    ACCEPTED: `${actorName} accepted your application.`,
    REJECTED: `${actorName} has responded to your application.`,
  };

  return {
    subject: `${sanitizeHeader(headings[kind] ?? headings.APPLICATION)} — ${sanitizeHeader(collaboration?.title)}`,
    html: layout({
      preheader: openings[kind] ?? openings.APPLICATION,
      heading: headings[kind] ?? headings.APPLICATION,
      bodyHtml: `
        ${paragraph(`${recipientName} — ${openings[kind] ?? openings.APPLICATION}`)}
        ${detailTable([
          ["Opportunity", collaboration?.title],
          ["Category", collaboration?.category],
          ["Location", collaboration?.location],
        ])}
        ${button(`${clientUrl}/collaborations`, "View the opportunity")}
      `,
    }),
  };
};
