const recipeService = require("../services/recipeService");
const deepseekService = require("../services/deepseekService");

/**
 * Recipe Controller
 *
 * Handles HTTP requests for recipe operations
 */

/**
 * Get user's recipes with pagination and filtering
 * GET /api/recipes
 */
async function getRecipes(req, res) {
  try {
    const userId = req.user.id;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      search: req.query.search || "",
      tags: req.query.tags || "",
      sortBy: req.query.sortBy || "updated_at",
      sortOrder: req.query.sortOrder || "desc",
    };

    const result = await recipeService.getUserRecipes(userId, options);

    res.json({
      success: true,
      data: result.recipes,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("[RecipeController] Error in getRecipes:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recipes",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Get a single recipe by ID
 * GET /api/recipes/:id
 */
async function getRecipe(req, res) {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id;

    const recipe = await recipeService.getRecipeById(recipeId, userId);

    res.json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    console.error("[RecipeController] Error in getRecipe:", error);

    if (error.message === "Recipe not found") {
      return res.status(404).json({
        success: false,
        error: "Recipe not found",
      });
    }

    if (error.message === "Access denied to this recipe") {
      return res.status(403).json({
        success: false,
        error: "Access denied to this recipe",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to fetch recipe",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Create a new recipe
 * POST /api/recipes
 */
async function createRecipe(req, res) {
  try {
    const userId = req.user.id;
    const recipeData = req.body;

    const recipe = await recipeService.createRecipe(userId, recipeData);

    res.status(201).json({
      success: true,
      data: recipe,
      message: "Recipe created successfully",
    });
  } catch (error) {
    console.error("[RecipeController] Error in createRecipe:", error);

    if (error.message.includes("Recipe limit reached")) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create recipe",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Update an existing recipe
 * PUT /api/recipes/:id
 */
async function updateRecipe(req, res) {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id;
    const updateData = req.body;

    const recipe = await recipeService.updateRecipe(
      recipeId,
      userId,
      updateData
    );

    res.json({
      success: true,
      data: recipe,
      message: "Recipe updated successfully",
    });
  } catch (error) {
    console.error("[RecipeController] Error in updateRecipe:", error);

    if (error.message.includes("Access denied")) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update recipe",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Delete a recipe
 * DELETE /api/recipes/:id
 */
async function deleteRecipe(req, res) {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id;

    const result = await recipeService.deleteRecipe(recipeId, userId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("[RecipeController] Error in deleteRecipe:", error);

    if (error.message.includes("Access denied")) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to delete recipe",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Toggle favorite status
 * POST /api/recipes/:id/favorite
 */
async function toggleFavorite(req, res) {
  try {
    const recipeId = req.params.id;
    const userId = req.user.id;

    const result = await recipeService.toggleFavorite(recipeId, userId);

    res.json({
      success: true,
      data: result,
      message: `Recipe ${
        result.isFavorite ? "added to" : "removed from"
      } favorites`,
    });
  } catch (error) {
    console.error("[RecipeController] Error in toggleFavorite:", error);
    res.status(500).json({
      success: false,
      error: "Failed to toggle favorite status",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Extract recipe from URL
 * POST /api/recipes/extract-url
 */
async function extractFromUrl(req, res) {
  try {
    const { url } = req.body;
    const userId = req.user.id;

    // Check if this is a premium feature (implement subscription check here)
    // For now, we'll allow all users

    const extractedRecipe = await deepseekService.extractRecipeFromUrl(url);

    // Optionally save the extracted recipe immediately
    if (req.body.saveImmediately) {
      const savedRecipe = await recipeService.createRecipe(
        userId,
        extractedRecipe
      );
      return res.json({
        success: true,
        data: savedRecipe,
        message: "Recipe extracted and saved successfully",
      });
    }

    res.json({
      success: true,
      data: extractedRecipe,
      message: "Recipe extracted successfully",
    });
  } catch (error) {
    console.error("[RecipeController] Error in extractFromUrl:", error);

    if (error.message.includes("premium feature")) {
      return res.status(403).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to extract recipe from URL",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Analyze recipe text with AI
 * POST /api/recipes/analyze-text
 */
async function analyzeText(req, res) {
  try {
    const { text, isInstagramContent = false } = req.body;
    const userId = req.user.id;

    const analyzedRecipe = await deepseekService.analyzeRecipeText(
      text,
      isInstagramContent
    );

    // Optionally save the analyzed recipe immediately
    if (req.body.saveImmediately) {
      const savedRecipe = await recipeService.createRecipe(
        userId,
        analyzedRecipe
      );
      return res.json({
        success: true,
        data: savedRecipe,
        message: "Recipe analyzed and saved successfully",
      });
    }

    res.json({
      success: true,
      data: analyzedRecipe,
      message: "Recipe analyzed successfully",
    });
  } catch (error) {
    console.error("[RecipeController] Error in analyzeText:", error);
    res.status(500).json({
      success: false,
      error: "Failed to analyze recipe text",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Get service logs (development only)
 * GET /api/recipes/logs
 */
async function getLogs(req, res) {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({
      success: false,
      error: "Logs are only available in development mode",
    });
  }

  try {
    const logs = deepseekService.getServiceLogs();
    const cacheStats = deepseekService.getCacheStats();

    res.json({
      success: true,
      data: {
        logs,
        cacheStats,
      },
    });
  } catch (error) {
    console.error("[RecipeController] Error in getLogs:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch logs",
    });
  }
}

/**
 * Clear cache (development only)
 * POST /api/recipes/clear-cache
 */
async function clearCache(req, res) {
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({
      success: false,
      error: "Cache clearing is only available in development mode",
    });
  }

  try {
    deepseekService.clearRecipeCache();
    deepseekService.clearServiceLogs();

    res.json({
      success: true,
      message: "Cache and logs cleared successfully",
    });
  } catch (error) {
    console.error("[RecipeController] Error in clearCache:", error);
    res.status(500).json({
      success: false,
      error: "Failed to clear cache",
    });
  }
}

module.exports = {
  getRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  toggleFavorite,
  extractFromUrl,
  analyzeText,
  getLogs,
  clearCache,
};
