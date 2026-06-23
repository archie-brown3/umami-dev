const express = require("express");
const recipeController = require("../controllers/recipeController");
const { authenticate } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validation");

const router = express.Router();

/**
 * Recipe Routes
 * All routes require authentication
 */

// Get user's recipes with pagination and filtering
router.get(
  "/",
  authenticate,
  validate(schemas.pagination, "query"),
  recipeController.getRecipes
);

// Extract recipe from URL
router.post(
  "/extract-url",
  authenticate,
  validate(schemas.urlExtraction),
  recipeController.extractFromUrl
);

// Analyze recipe text with AI
router.post(
  "/analyze-text",
  authenticate,
  validate(schemas.textAnalysis),
  recipeController.analyzeText
);

// Development endpoints
router.get("/logs", authenticate, recipeController.getLogs);

router.post("/clear-cache", authenticate, recipeController.clearCache);

// Get a single recipe by ID
router.get("/:id", authenticate, recipeController.getRecipe);

// Create a new recipe
router.post(
  "/",
  authenticate,
  validate(schemas.recipe),
  recipeController.createRecipe
);

// Update an existing recipe
router.put(
  "/:id",
  authenticate,
  validate(schemas.recipeUpdate),
  recipeController.updateRecipe
);

// Delete a recipe
router.delete("/:id", authenticate, recipeController.deleteRecipe);

// Toggle favorite status
router.post("/:id/favorite", authenticate, recipeController.toggleFavorite);

module.exports = router;
