import express from "express";
import cors from "cors";
import { initNodemailer } from "./utils/nodemailer.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

const app = express();
const PORT = process.env.PORT || 5004;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

// Health check
app.get("/health", (req, res) =>
  res.status(200).json({ status: "Notification service is running" }),
);

// Connect and start server
const startServer = async () => {
  try {
    await initNodemailer();
    await connectRabbitMQ();
    app.listen(PORT, () => {
      console.log(`🟢 Notification Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
