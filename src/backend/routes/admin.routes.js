const express = require("express");
const requireAuth = require("../middleware/require-auth");
const requireAdmin = require("../middleware/require-admin");
const uploadProductImage = require("../middleware/upload-product-image");
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require("../controllers/admin.controller");

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/categories", listCategories);
router.post("/categories", createCategory);
router.patch("/categories/:categoryId", updateCategory);
router.delete("/categories/:categoryId", deleteCategory);

router.get("/products", listAdminProducts);
router.post("/products", uploadProductImage.array("image_file", 8), createProduct);
router.patch("/products/:productId", uploadProductImage.array("image_file", 8), updateProduct);
router.delete("/products/:productId", deleteProduct);

module.exports = router;
