const express = require("express");
const healthRoutes = require("./health.routes");
const productsRoutes = require("./products.routes");
const usersRoutes = require("./users.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/products", productsRoutes);
router.use("/users", usersRoutes);

module.exports = router;
