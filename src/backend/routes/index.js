const express = require("express");
const healthRoutes = require("./health.routes");
const productsRoutes = require("./products.routes");
const usersRoutes = require("./users.routes");
const adminRoutes = require("./admin.routes");
const cartRoutes = require("./cart.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/products", productsRoutes);
router.use("/users", usersRoutes);
router.use("/admin", adminRoutes);
router.use("/cart", cartRoutes);

module.exports = router;
