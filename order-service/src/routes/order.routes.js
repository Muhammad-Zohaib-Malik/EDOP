import express from "express";
import {
  checkoutOrder,
  getOrders,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/order.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/checkout", checkoutOrder);
router.get("/", verifyAdmin, getOrders);
router.patch("/:id/status", verifyAdmin, updateOrderStatus);
router.delete("/:id", verifyAdmin, deleteOrder);

export default router;
