const {
  layout,
  paragraph,
  detailTable,
  button,
  sanitizeHeader,
} = require("./layout");
const { formatMoney } = require("../../../utils/money");

/**
 * Sent to the CLIENT when their order is created.
 *
 * Deliberately does not claim anything about payment — an order exists before
 * money moves, and paymentStatus is a separate field. The payment confirmation
 * is its own email, sent only after Paystack verification.
 */
module.exports = ({ order, clientName, creativeName, clientUrl }) => ({
  subject: `Order placed — ${sanitizeHeader(order.serviceSnapshot?.title)}`,
  html: layout({
    preheader: `Your order with ${creativeName} has been placed.`,
    heading: "Order placed",
    bodyHtml: `
      ${paragraph(`${clientName} — your order has been placed with ${creativeName}.`)}
      ${detailTable([
        ["Service", order.serviceSnapshot?.title],
        ["Creative", creativeName],
        ["Order reference", order._id?.toString()],
        ["Amount", formatMoney(order.amount, order.currency)],
        ["Order status", order.status],
        ["Payment", order.paymentStatus],
      ])}
      ${paragraph(
        order.paymentStatus === "PAID"
          ? "Payment has been received. Your creative will begin work shortly."
          : "Payment has not been taken yet. You can pay for this order from your dashboard.",
      )}
      ${button(`${clientUrl}/orders`, "View your order")}
    `,
  }),
});
