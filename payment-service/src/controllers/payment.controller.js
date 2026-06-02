import Stripe from "stripe";
import { publishEvent } from "../config/rabbitmq.js";
import pool from "../config/db.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    const { orderId, totalAmount, customerEmail, items } = req.body;

    if (!orderId || !totalAmount) {
      return res.status(400).json({ message: "Order ID and total amount are required" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "pkr", // adjust currency if needed
            product_data: {
              name: `Order ${orderId}`,
            },
            unit_amount: Math.round(totalAmount * 100), // Stripe expects amounts in cents/smallest currency unit
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      customer_email: customerEmail,
      metadata: {
        orderId,
      },
    });

    res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error("Create Checkout Session Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_12345";

  let event;

  try {
    // Note: for webhook to work, req.body must be a raw buffer
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const orderId = session.metadata.orderId;
    const customerEmail = session.customer_details?.email || "";
    const amount = session.amount_total / 100; // Convert cents back to main currency unit

    console.log(`Payment successful for order: ${orderId}`);

    try {
      // Save payment in Database
      await pool.query(
        `INSERT INTO payments (order_id, transaction_id, user_email, amount, status) 
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, session.id, customerEmail, amount, "SUCCESS"]
      );
    } catch (dbError) {
      console.error("Failed to save payment to DB:", dbError.message);
      // We log it but do not fail the webhook entirely, we still want to process the order
    }

    // Publish event for order-service to pick up
    await publishEvent("payment.success", { orderId, paymentId: session.id });
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
};
