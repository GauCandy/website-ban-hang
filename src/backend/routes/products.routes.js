const express = require("express");
const { getHomepageProducts, getProductBySlug, listProducts } = require("../controllers/products.controller");

const router = express.Router();

router.get("/", listProducts);
router.get("/home", getHomepageProducts);
router.get("/:slug", getProductBySlug);

module.exports = router;
