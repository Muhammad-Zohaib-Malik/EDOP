import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDatabase } from "./config/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { initOrdersIndex } from "./config/elasticsearch.js";
import orderRoutes from "./routes/order.routes.js";

const app = express();

app.use(
  cors({
    origin: ["https://meredukaan.netlify.app", "http://localhost:5173"],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/orders", orderRoutes);

// Health check
app.get("/health", (req, res) =>
  res.status(200).json({ status: "Order service is running" }),
);

const PORT = process.env.PORT || 5003;

// Connect to Database and start server
const startServer = async () => {
  try {
    await connectDatabase();
    await connectRabbitMQ();
    await initOrdersIndex();
    app.listen(PORT, () => {
      console.log(`🟢 Order Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
