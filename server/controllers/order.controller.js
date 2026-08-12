const orderService = require("../services/order.service");
const ApiError = require("../utils/ApiError");
const { validateOrder, validateOrderStatus } = require("../utils/validators");
const { ORDER_STATUS, values } = require("../utils/constants");

/** POST /api/orders */
const createOrder = async (req, res) => {
  const { errors, fields, value } = validateOrder(req.body);
  if (errors.length) throw ApiError.badRequest("Validation failed", errors, fields);

  const order = await orderService.create(req.user, value);

  res.status(201).json({
    success: true,
    message: "Order placed",
    data: { order },
  });
};

/**
 * GET /api/orders?role=client|creative
 *
 * Defaults to the buyer view. `role` selects which side of the relationship to
 * match — it can never widen access, because both branches filter on the
 * caller's own id.
 */
const getOrders = async (req, res) => {
  const role = req.query.role === "creative" ? "creative" : "client";

  const status = req.query.status
    ? String(req.query.status).trim().toUpperCase()
    : undefined;
  if (status && !values(ORDER_STATUS).includes(status)) {
    throw ApiError.badRequest(
      `Invalid status. Allowed: ${values(ORDER_STATUS).join(", ")}`,
    );
  }

  const orders = await orderService.listForUser(req.user._id, role, { status });

  res.json({
    success: true,
    message: "Orders retrieved",
    data: {
      orders: orders.map((order) => ({
        ...order.toJSON(),
        availableTransitions: orderService.availableTransitions(
          order,
          role,
          req.user.role,
        ),
      })),
      role,
      count: orders.length,
    },
  });
};

/** GET /api/orders/:id — participants only. */
const getOrder = async (req, res) => {
  const { order, relation } = await orderService.getById(
    req.params.id,
    req.user,
  );

  res.json({
    success: true,
    message: "Order retrieved",
    data: {
      order,
      relation,
      availableTransitions: orderService.availableTransitions(
        order,
        relation,
        req.user.role,
      ),
    },
  });
};

/** PATCH /api/orders/:id/status */
const updateOrderStatus = async (req, res) => {
  const { errors, fields, value } = validateOrderStatus(req.body);
  if (errors.length) throw ApiError.badRequest("Validation failed", errors, fields);

  const order = await orderService.updateStatus(
    req.params.id,
    req.user,
    value.status,
  );

  // Recomputed for the new status and returned with the order, so a dashboard
  // can render the next set of actions without a reload.
  const relation = orderService.relationOf(order, req.user);
  const availableTransitions = orderService.availableTransitions(
    order,
    relation,
    req.user.role,
  );

  res.json({
    success: true,
    message: `Order marked ${value.status}`,
    data: { order, relation, availableTransitions },
  });
};

module.exports = { createOrder, getOrders, getOrder, updateOrderStatus };
