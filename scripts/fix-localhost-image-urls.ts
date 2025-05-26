/**
 * Script to fix existing recipes with localhost image URLs
 * This script updates recipes in Supabase that have localhost:3001 image URLs
 * and replaces them with proper production proxy URLs
 */

import { supabase } from "../lib/supabase";
import { processImageUrl } from "../utils/imageProcessor";

interface RecipeToFix {
  id: string;
  image_url: string;
}

/**
 * Find all recipes with localhost image URLs
 */
async function findRecipesWithLocalhostUrls(): Promise<RecipeToFix[]> {
  console.log("[FixScript] Searching for recipes with localhost image URLs...");

  const { data, error } = await supabase
    .from("recipes")
    .select("id, image_url")
    .like("image_url", "%localhost:3001%");

  if (error) {
    console.error("[FixScript] Error fetching recipes:", error);
    throw error;
  }

  console.log(
    `[FixScript] Found ${data?.length || 0} recipes with localhost URLs`
  );
  return data || [];
}

/**
 * Fix a single recipe's image URL
 */
async function fixRecipeImageUrl(recipe: RecipeToFix): Promise<boolean> {
  try {
    console.log(`[FixScript] Fixing recipe ${recipe.id}: ${recipe.image_url}`);

    // Use the unified image processor to fix the URL
    const fixedUrl = processImageUrl(recipe.image_url);

    if (!fixedUrl || fixedUrl === recipe.image_url) {
      console.log(`[FixScript] No fix needed for recipe ${recipe.id}`);
      return false;
    }

    // Update the recipe in the database
    const { error } = await supabase
      .from("recipes")
      .update({ image_url: fixedUrl })
      .eq("id", recipe.id);

    if (error) {
      console.error(`[FixScript] Error updating recipe ${recipe.id}:`, error);
      return false;
    }

    console.log(
      `[FixScript] Successfully fixed recipe ${recipe.id}: ${fixedUrl}`
    );
    return true;
  } catch (error) {
    console.error(`[FixScript] Error processing recipe ${recipe.id}:`, error);
    return false;
  }
}

/**
 * Main function to fix all recipes with localhost URLs
 */
export async function fixAllLocalhostImageUrls(): Promise<{
  total: number;
  fixed: number;
  failed: number;
}> {
  console.log("[FixScript] Starting localhost image URL fix process...");

  try {
    // Find all recipes with localhost URLs
    const recipesToFix = await findRecipesWithLocalhostUrls();

    if (recipesToFix.length === 0) {
      console.log("[FixScript] No recipes found with localhost URLs");
      return { total: 0, fixed: 0, failed: 0 };
    }

    // Fix each recipe
    let fixed = 0;
    let failed = 0;

    for (const recipe of recipesToFix) {
      const success = await fixRecipeImageUrl(recipe);
      if (success) {
        fixed++;
      } else {
        failed++;
      }

      // Add a small delay to avoid overwhelming the database
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const results = {
      total: recipesToFix.length,
      fixed,
      failed,
    };

    console.log(`[FixScript] Fix process completed:`, results);
    return results;
  } catch (error) {
    console.error("[FixScript] Fix process failed:", error);
    throw error;
  }
}

/**
 * Dry run function to preview what would be fixed
 */
export async function previewLocalhostImageUrlFixes(): Promise<void> {
  console.log("[FixScript] Running dry run to preview fixes...");

  try {
    const recipesToFix = await findRecipesWithLocalhostUrls();

    if (recipesToFix.length === 0) {
      console.log("[FixScript] No recipes found with localhost URLs");
      return;
    }

    console.log(
      `[FixScript] Preview of ${recipesToFix.length} recipes to fix:`
    );

    for (const recipe of recipesToFix) {
      const fixedUrl = processImageUrl(recipe.image_url);
      console.log(`[FixScript] Recipe ${recipe.id}:`);
      console.log(`  Current: ${recipe.image_url}`);
      console.log(`  Fixed:   ${fixedUrl}`);
      console.log("");
    }
  } catch (error) {
    console.error("[FixScript] Preview failed:", error);
    throw error;
  }
}

// Export for use in other scripts or manual execution
export { findRecipesWithLocalhostUrls, fixRecipeImageUrl };
