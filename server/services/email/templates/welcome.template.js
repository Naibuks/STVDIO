const { layout, paragraph, button, sanitizeHeader } = require("./layout");

/**
 * Sent once, on successful registration.
 *
 * STVDIO° has no separate "confirm your address" step — registration creates a
 * usable account immediately — so this is both the welcome and the
 * registration confirmation. A second near-identical email would be noise.
 */
module.exports = ({ name, username, clientUrl }) => ({
  subject: `Welcome to STVDIO°, ${sanitizeHeader(name)}`,
  html: layout({
    preheader: "Your STVDIO° account is ready.",
    heading: "Your account is live",
    bodyHtml: `
      ${paragraph(`${name} — welcome to STVDIO°.`)}
      ${paragraph(
        "STVDIO° is where creatives show their work, find each other, and get hired. Your profile is live now; adding a few projects is the fastest way to be found.",
      )}
      ${paragraph(`You are signed up as @${username}.`)}
      ${button(`${clientUrl}/profile`, "Complete your profile")}
      ${paragraph("Publish work, follow other creatives, or list a service on the marketplace whenever you are ready.")}
    `,
  }),
});
