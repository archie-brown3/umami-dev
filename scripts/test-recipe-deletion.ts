/**
 * Test script to verify recipe deletion flow
 * This helps debug and verify the complete deletion process
 */

import { RecipeService } from "@/services/recipeService";
import { eventEmitter, EVENTS } from "@/utils/eventEmitter";

export async function testRecipeDeletion(recipeId: string, userId?: string) {
  console.log("🧪 Testing Recipe Deletion Process");
  console.log("==================================");
  console.log(`Recipe ID: ${recipeId}`);
  console.log(`User ID: ${userId || "not provided"}`);

  // Listen for deletion events
  const eventListener = (deletedRecipeId: string) => {
    console.log(`✅ Event emitted: Recipe ${deletedRecipeId} deleted`);
  };

  eventEmitter.on(EVENTS.RECIPE_DELETED, eventListener);

  try {
    console.log("\n1. Starting deletion...");

    // Test the complete deletion flow
    await RecipeService.deleteRecipe(recipeId);

    console.log("✅ Deletion completed successfully");

    // Check if recipe still exists (should fail)
    console.log("\n2. Verifying deletion...");
    try {
      const { fetchRecipeById } = require("@/services/recipeService");
      const recipe = await fetchRecipeById(recipeId);

      if (recipe) {
        console.log("❌ FAILURE: Recipe still exists after deletion");
        return false;
      } else {
        console.log("✅ SUCCESS: Recipe properly deleted from database");
        return true;
      }
    } catch (error) {
      console.log("✅ SUCCESS: Recipe not found (properly deleted)");
      return true;
    }
  } catch (error) {
    console.error("❌ DELETION FAILED:", error);
    return false;
  } finally {
    // Clean up event listener
    eventEmitter.off(EVENTS.RECIPE_DELETED, eventListener);
  }
}

// Helper function to list all recipes for a user (debugging)
export async function listUserRecipes(userId: string) {
  console.log(`\n📋 Listing recipes for user: ${userId}`);

  try {
    const { getUserRecipes } = require("@/services/recipeService");
    const recipes = await getUserRecipes(userId);

    console.log(`Found ${recipes.length} recipes:`);
    recipes.forEach((recipe, index) => {
      console.log(`${index + 1}. ${recipe.title} (ID: ${recipe.id})`);
    });

    return recipes;
  } catch (error) {
    console.error("Error listing recipes:", error);
    return [];
  }
}
