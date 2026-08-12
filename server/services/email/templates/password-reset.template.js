const { layout, paragraph, button } = require("./layout");

/**
 * Password reset email.
 *
 * INFRASTRUCTURE ONLY — nothing calls this yet. STVDIO° has no password-reset
 * flow: there is no reset token on the User model and no forgot-password
 * route. Building that belongs to the authentication phase, not to email, so
 * Phase 8 provides the template and stops there.
 *
 * The caller is responsible for generating a single-use, expiring token and
 * building the URL. This template never receives or prints a password, and
 * the token appears only inside the link.
 */
module.exports = ({ name, resetUrl, expiresInMinutes = 60 }) => ({
  subject: "Reset your STVDIO° password",
  html: layout({
    preheader: "A link to set a new password.",
    heading: "Reset your password",
    bodyHtml: `
      ${paragraph(`${name} — we received a request to reset your STVDIO° password.`)}
      ${paragraph(`Use the link below to set a new one. It expires in ${expiresInMinutes} minutes and can only be used once.`)}
      ${button(resetUrl, "Set a new password")}
      ${paragraph(
        "If you did not request this, you can ignore this email — your password will not change.",
      )}
    `,
  }),
});
