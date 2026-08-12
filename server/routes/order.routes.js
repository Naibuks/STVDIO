const express = require("express");
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
} = require("../controllers/order.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// Every order route is private — there is no public view of a transaction.
router.post("/", authenticate, createOrder);
router.get("/", authenticate, getOrders);
router.get("/:id", authenticate, getOrder);
router.patch("/:id/status", authenticate, updateOrderStatus);

module.exports = router;
