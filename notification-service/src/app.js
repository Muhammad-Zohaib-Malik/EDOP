import express from "express";
import cors from "cors";
import { initNodemailer } from "./utils/nodemailer.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

const app = express();
const PORT = process.env.PORT || 5004;

app.use(
  cors({
    origin: ["https://meredukaan.netlify.app", "http://localhost:5173"],

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
  // Bind the port immediately so Render doesn't time out
  app.listen(PORT, "0.0.0.0", async () => {
    console.log(`🟢 Notification Service running on port ${PORT}`);
    
    // Initialize background services after server is up
    try {
      await initNodemailer();
      await connectRabbitMQ();
    } catch (error) {
      console.error("Failed to initialize background services:", error);
    }
  });
};

startServer();
