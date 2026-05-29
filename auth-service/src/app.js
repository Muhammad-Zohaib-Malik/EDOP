import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/auth.route.js";
import { connectDatabase } from "./config/db.js";

const port = process.env.PORT || 5001;
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["https://meredukaan.netlify.app/","http://localhost:5173"],
    credentials: true,
  }),
);

app.use("/api/auth", userRoutes);

app.get("/", (req, res) => {
  res.json({message:"Health Check ✅"});
});

// Connect to Database and start server
const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(port, () => {
      console.log(`🟢 Auth Service is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
