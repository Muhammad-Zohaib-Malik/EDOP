import express from "express";
import {
  checkoutOrder, getOrders, updateOrderStatus, searchOrders,
} from "../controllers/order.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Search must be before /:id so "search" isn't treated as an id
router.get("/search", verifyAdmin, searchOrders);

router.post("/checkout", checkoutOrder);
router.get("/", verifyAdmin, getOrders);
router.patch("/:id/status", verifyAdmin, updateOrderStatus);

export default router;
