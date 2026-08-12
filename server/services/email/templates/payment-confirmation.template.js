const {
  layout,
  paragraph,
  detailTable,
  button,
  sanitizeHeader,
} = require("./layout");
const { formatMoney } = require("../../../utils/money");

/**
 * Sent to the CLIENT only after the backend has verified the transaction with
 * Paystack. It is triggered from payment.service.applySuccessfulTransaction,
 * which is the single point both the verify endpoint and the webhook pass
 * through — so a frontend claiming success can never produce this email.
 */
module.exports = ({ order, payment, clientName, clientUrl }) => ({
  subject: `Payment received — ${sanitizeHeader(order.serviceSnapshot?.title)}`,
  html: layout({
    preheader: `We received ${formatMoney(payment.amount, payment.currency)}.`,
    heading: "Payment received",
    bodyHtml: `
      ${paragraph(`${clientName} — your payment has been confirmed.`)}
      ${detailTable([
        ["Service", order.serviceSnapshot?.title],
        ["Amount", formatMoney(payment.amount, payment.currency)],
        ["Payment status", payment.status],
        ["Payment reference", payment.reference],
        ["Order reference", order._id?.toString()],
        [
          "Date",
          (payment.paidAt ? new Date(payment.paidAt) : new Date()).toUTCString(),
        ],
      ])}
      ${paragraph("Your creative has been notified and can now begin work. This email is your receipt.")}
      ${button(`${clientUrl}/orders`, "View your order")}
    `,
  }),
});
