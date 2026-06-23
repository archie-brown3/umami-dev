const express = require("express");
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validation");

const router = express.Router();

/**
 * Authentication Routes
 */

// Verify JWT token
router.post(
  "/verify",
  validate(schemas.tokenVerification),
  authController.verifyToken
);

// Get current user profile (requires authentication)
router.get("/profile", authenticate, authController.getProfile);

// Health check
router.get("/health", authController.healthCheck);

module.exports = router;
