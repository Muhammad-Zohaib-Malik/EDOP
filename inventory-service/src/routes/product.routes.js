import express from "express";
import { 
  createProduct, 
  getProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct,
  updateStock,
  reserveStock
} from "../controllers/product.controller.js";
import { verifyAdmin } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

// All operations strictly restricted to admin as requested
router.get("/", verifyAdmin, getProducts);
router.get("/:id", verifyAdmin, getProductById);
router.post("/:id/reserve", verifyAdmin, reserveStock);

// Only admins can manage products and update stock manually
router.post("/", verifyAdmin, upload.single("picture"), createProduct);
router.put("/:id", verifyAdmin, upload.single("picture"), updateProduct);
router.patch("/:id/stock", verifyAdmin, updateStock);
router.delete("/:id", verifyAdmin, deleteProduct);

export default router;
