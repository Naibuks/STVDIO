const {
  layout,
  paragraph,
  detailTable,
  button,
  sanitizeHeader,
} = require("./layout");
const { formatMoney } = require("../../../utils/money");

/**
 * Sent to the CREATIVE when someone orders their service.
 *
 * The buyer's brief is included because it is what the creative needs to
 * decide whether to accept — it is escaped by detailTable like every other
 * user-supplied value.
 */
module.exports = ({ order, clientName, creativeName, clientUrl }) => ({
  subject: `New order — ${sanitizeHeader(order.serviceSnapshot?.title)}`,
  html: layout({
    preheader: `${clientName} has ordered your service.`,
    heading: "You have a new order",
    bodyHtml: `
      ${paragraph(`${creativeName} — ${clientName} has ordered your service.`)}
      ${detailTable([
        ["Service", order.serviceSnapshot?.title],
        ["Client", clientName],
        ["Order reference", order._id?.toString()],
        ["Amount", formatMoney(order.amount, order.currency)],
        ["Order status", order.status],
        ["Payment", order.paymentStatus],
        ["Brief", order.requirements],
      ])}
      ${paragraph("Accept the order from your dashboard to start work.")}
      ${button(`${clientUrl}/orders`, "Open your orders")}
    `,
  }),
});
