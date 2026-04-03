const express = require("express");
const {
  addCartItem,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem
} = require("../controllers/cart.controller");

const router = express.Router();

router.get("/", getCart);
router.post("/items", addCartItem);
router.patch("/items/:productId", updateCartItem);
router.delete("/items/:productId", removeCartItem);
router.delete("/", clearCart);

module.exports = router;
