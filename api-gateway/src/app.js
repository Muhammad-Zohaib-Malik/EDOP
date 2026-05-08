import express from "express";
import proxy from "express-http-proxy";
const port = process.env.PORT || 3001;
const app = express();
app.use(express.json());

app.get("/", (_, res) => {
  res.send("Health Check");
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

const startServer = async () => {
  try {
    app.listen(port, () => {
      console.log(`Api GateWay is running at http://localhost:${port}`);
      console.log(`Auth Service is running at ${process.env.AUTH_SERVICE_URL}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
