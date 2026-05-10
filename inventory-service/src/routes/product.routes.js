import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateStock,
  reserveStock,
} from "../controllers/product.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

// Public routes for users to browse and place orders
router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/:id/reserve", reserveStock);
router.patch("/:id/stock", updateStock);

// Only admins can manage products and update stock manually
router.post("/", verifyAdmin, upload.single("picture"), createProduct);
router.put("/:id", verifyAdmin, upload.single("picture"), updateProduct);

router.delete("/:id", verifyAdmin, deleteProduct);

export default router;
