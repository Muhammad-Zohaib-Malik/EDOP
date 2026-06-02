import express from "express";
import cors from "cors";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { connectDatabase } from "./config/db.js";
import paymentRoutes from "./routes/payment.routes.js";

const app = express();

app.use(
  cors({
    origin: ["https://meredukaan.netlify.app", "http://localhost:5173"],
    credentials: true,
  }),
);

// We don't use app.use(express.json()) globally here because the stripe webhook 
// requires the raw request body. It is handled in the routes file.

// Routes
app.use("/api/payment", paymentRoutes);

// Health check
app.get("/health", (req, res) =>
  res.status(200).json({ status: "Payment service is running" }),
);

const PORT = process.env.PORT || 5005;

// Connect to RabbitMQ, DB and start server
const startServer = async () => {
  try {
    await connectDatabase();
    await connectRabbitMQ();
    app.listen(PORT, () => {
      console.log(`🟢 Payment Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
