import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "fs";
import { connectDatabase } from "./config/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import { initProductsIndex } from "./config/elasticsearch.js";
import productRoutes from "./routes/product.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: ["https://meredukaan.netlify.app","http://localhost:5173"],
    credentials: true,
  }),
);

// Create uploads directory if it doesn't exist
const uploadsDir = "uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve uploaded images statically
app.use("/uploads", express.static(uploadsDir));

// Routes
app.use("/api/products", productRoutes);

// Health check
app.get("/", (req, res) =>
  res.status(200).json({ status: "Inventory service is running" }),
);

const PORT = process.env.PORT || 5002;

// Connect to Database and start server
const startServer = async () => {
  try {
    await connectDatabase();
    await connectRabbitMQ();
    await initProductsIndex();
    app.listen(PORT, () => {
      console.log(`🟢 Inventory Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
