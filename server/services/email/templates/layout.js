/**
 * Shared shell for every STVDIO° email.
 *
 * Table-based, inline-styled HTML: email clients strip <style> blocks, ignore
 * flexbox and frequently drop external CSS, so the constraints here are the
 * medium's, not a stylistic choice. Editorial and restrained to match the
 * product — heavy type, generous space, hairline rules, no gradients.
 */

/**
 * Escape anything that came from a user before it reaches HTML.
 *
 * Names, service titles and requirements are all user-controlled. Without this
 * a display name of `<img onerror=...>` would be rendered by any email client
 * that executes it.
 */
const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Strip CR/LF from anything interpolated into a header (subject, recipient
 * name). A newline there would let user input inject extra headers.
 */
const sanitizeHeader = (value) =>
  String(value ?? "")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, 200);

const INK = "#111111";
const MUTED = "#6b6b6b";
const RULE = "#e4e4e4";
const FONT =
  "'Helvetica Neue', Helvetica, Arial, 'Segoe UI', system-ui, sans-serif";

/** A labelled row in the detail table. `value` must already be escaped. */
const detailRow = (label, value) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid ${RULE};font:400 11px/1.4 ${FONT};letter-spacing:0.12em;text-transform:uppercase;color:${MUTED};">${escapeHtml(label)}</td>
    <td style="padding:10px 0;border-bottom:1px solid ${RULE};font:500 14px/1.4 ${FONT};color:${INK};text-align:right;">${value}</td>
  </tr>`;

/** Builds the detail table from [label, value] pairs, skipping empty values. */
const detailTable = (rows) => {
  const body = rows
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([label, value]) => detailRow(label, escapeHtml(value)))
    .join("");

  if (!body) return "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;border-collapse:collapse;">${body}</table>`;
};

const button = (href, label) => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px 0 8px;">
    <tr>
      <td style="background:${INK};">
        <a href="${escapeHtml(href)}" style="display:inline-block;padding:14px 26px;font:500 11px/1 ${FONT};letter-spacing:0.16em;text-transform:uppercase;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;

/**
 * Wrap body content in the branded shell.
 * `bodyHtml` is inserted as-is, so callers must escape their own user data —
 * use escapeHtml or detailTable rather than interpolating raw values.
 */
const layout = ({ preheader, heading, bodyHtml }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:#fafafa;">
  <!-- Preview text: shown in the inbox list, hidden in the message itself. -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader ?? "")}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${RULE};">
          <tr>
            <td style="padding:32px 32px 0;">
              <span style="font:500 18px/1 ${FONT};letter-spacing:-0.01em;color:${INK};">STVDIO<sup style="font-size:9px;">&deg;</sup></span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px 36px;">
              <h1 style="margin:0 0 16px;font:500 26px/1.2 ${FONT};letter-spacing:-0.02em;color:${INK};">${escapeHtml(heading)}</h1>
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;border-top:1px solid ${RULE};">
              <p style="margin:0;font:400 11px/1.6 ${FONT};letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">
                STVDIO&deg; — a creative networking, portfolio and marketplace platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/** Standard body paragraph. Escapes its own content. */
const paragraph = (text) =>
  `<p style="margin:0 0 14px;font:400 15px/1.65 ${FONT};color:#333333;">${escapeHtml(text)}</p>`;

module.exports = {
  layout,
  paragraph,
  detailTable,
  button,
  escapeHtml,
  sanitizeHeader,
  FONT,
  MUTED,
};
