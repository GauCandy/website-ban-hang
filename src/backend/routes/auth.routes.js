const express = require("express");
const requireAuth = require("../middleware/require-auth");
const {
  getCurrentUser,
  handleGoogleCallback,
  logout,
  startGoogleAuth
} = require("../controllers/auth.controller");

const router = express.Router();

router.get("/google", startGoogleAuth);
router.get("/callback", handleGoogleCallback);
router.get("/me", requireAuth, getCurrentUser);
router.post("/logout", logout);

module.exports = router;
