const express = require("express");
const requireAuth = require("../middleware/require-auth");
const {
  createCurrentUserAddress,
  deleteCurrentUserAddress,
  getCurrentUserAddress,
  getCurrentUserAddresses,
  getCurrentUserProfile,
  listUsers,
  updateCurrentUserAddress,
  updateCurrentUserProfile,
  upsertCurrentUserAddress
} = require("../controllers/users.controller");

const router = express.Router();

router.get("/me", requireAuth, getCurrentUserProfile);
router.patch("/me", requireAuth, updateCurrentUserProfile);
router.get("/me/address", requireAuth, getCurrentUserAddress);
router.put("/me/address", requireAuth, upsertCurrentUserAddress);
router.get("/me/addresses", requireAuth, getCurrentUserAddresses);
router.post("/me/addresses", requireAuth, createCurrentUserAddress);
router.patch("/me/addresses/:addressId", requireAuth, updateCurrentUserAddress);
router.delete("/me/addresses/:addressId", requireAuth, deleteCurrentUserAddress);
router.get("/", listUsers);

module.exports = router;
