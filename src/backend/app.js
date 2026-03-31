const express = require("express");
const cors = require("cors");
const path = require("path");
const env = require("./config/env");
const apiRoutes = require("./routes");
const authRoutes = require("./routes/auth.routes");
const csrfProtection = require("./middleware/csrf-protection");

const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === env.webOrigin) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true
  })
);
app.use(express.json());
app.use(csrfProtection({ allowedOrigin: env.webOrigin }));
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.get("/", (_req, res) => {
  res.json({
    name: "whitecat2-backend",
    status: "ready",
    docs: {
      auth: "/auth/google",
      health: "/api/health",
      products: "/api/products",
      users: "/api/users"
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
