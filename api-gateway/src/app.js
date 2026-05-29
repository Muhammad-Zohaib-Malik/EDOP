import express from "express";
import proxy from "express-http-proxy";
import cors from "cors";

const port = process.env.PORT || 5000;
const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ["https://meredukaan.netlify.app","http://localhost:5173"],
    credentials: true,
  }),
);

app.get("/", (_, res) => {
  res.json({message:"Health Check ✅"});
});

const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (error, res) => {
    console.log("Proxy Error:", error.message);
    const status = error.status || 500;
    const message = error.message || "Internal server error";
    res.status(status).json({ status, message });
  },
};

// setting up proxy for auth-service
app.use(
  "/v1/auth",
  proxy(process.env.AUTH_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      console.log("Res Status from Auth Service:", proxyRes.statusCode);
      console.log("Res Data from Auth Service:", proxyResData.toString());
      return proxyResData;
    },
  }),
);

// setting up proxy for inventory-service
app.use(
  "/v1/products",
  proxy(process.env.INVENTORY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      if (!srcReq.headers["content-type"]?.includes("multipart/form-data")) {
        proxyReqOpts.headers["Content-Type"] = "application/json";
      }
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      console.log("Res Status from Inventory Service:", proxyRes.statusCode);
      return proxyResData;
    },
  }),
);

// setting up proxy for order-service
app.use(
  "/v1/orders",
  proxy(process.env.ORDER_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      console.log("Res Status from Order Service:", proxyRes.statusCode);
      return proxyResData;
    },
  }),
);

const startServer = async () => {
  try {
    app.listen(port, () => {
      console.log(`Api GateWay is running at http://localhost:${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
