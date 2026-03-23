const express = require("express");
const { getHomepageProducts, listProducts } = require("../controllers/products.controller");

const router = express.Router();

router.get("/", listProducts);
router.get("/home", getHomepageProducts);

module.exports = router;
