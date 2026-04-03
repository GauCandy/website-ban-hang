const express = require("express");
const cors = require("cors");
const path = require("path");
const env = require("./config/env");
const apiRoutes = require("./routes");
const authRoutes = require("./routes/auth.routes");
const csrfProtection = require("./middleware/csrf-protection");

const app = express();
const allowedFrontendOrigins = new Set([
  env.webOrigin,
  `http://localhost:${env.webPort}`,
  `http://127.0.0.1:${env.webPort}`
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedFrontendOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true
  })
);
app.use(express.json());
app.use(csrfProtection({ allowedOrigins: Array.from(allowedFrontendOrigins) }));
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/", (_req, res) => {
  res.json({
    name: "whitecat2-backend",
    status: "ready",
    docs: {
      auth: "/auth/google",
      health: "/api/health",
      products: "/api/products",
      users: "/api/users",
      cart: "/api/cart"
    },
    frontend: env.baseUrl
  });
});

app.use("/auth", authRoutes);
app.use("/api", apiRoutes);

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    message: "Đã xảy ra lỗi phía máy chủ."
  });
});

module.exports = app;
