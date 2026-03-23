const express = require("express");
const requireAuth = require("../middleware/require-auth");
const { getCurrentUserProfile, listUsers } = require("../controllers/users.controller");

const router = express.Router();

router.get("/me", requireAuth, getCurrentUserProfile);
router.get("/", listUsers);

module.exports = router;
