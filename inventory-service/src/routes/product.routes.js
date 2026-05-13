import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  updateStock,
  reserveStock,
  searchProducts,
} from "../controllers/product.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

// Search must be before /:id so "search" isn't treated as an id
router.get("/search", searchProducts);

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/:id/reserve", verifyAdmin, reserveStock);
router.patch("/:id/stock", verifyAdmin, updateStock);

router.post("/", verifyAdmin, upload.single("picture"), createProduct);
router.put("/:id", verifyAdmin, upload.single("picture"), updateProduct);
router.delete("/:id", verifyAdmin, deleteProduct);

export default router;
