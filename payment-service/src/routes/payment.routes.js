import express from "express";
import { createCheckoutSession, handleWebhook } from "../controllers/payment.controller.js";

const router = express.Router();

router.post("/create-checkout-session", express.json(), createCheckoutSession);

// Webhook needs raw body for Stripe signature verification
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

export default router;
