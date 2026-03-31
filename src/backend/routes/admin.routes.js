const express = require("express");
const requireAuth = require("../middleware/require-auth");
const requireAdmin = require("../middleware/require-admin");
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listAdminProducts,
  createProduct
} = require("../controllers/admin.controller");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/categories", listCategories);
router.post("/categories", createCategory);
router.patch("/categories/:categoryId", updateCategory);
router.delete("/categories/:categoryId", deleteCategory);

router.get("/products", listAdminProducts);
router.post("/products", createProduct);

module.exports = router;
