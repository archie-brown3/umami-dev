import { supabase } from "../utils/supabase";
import { Recipe, RecipeWithDetails } from "../types/recipe";

// Utility function to retry a function with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    console.log(`Retrying operation in ${delay}ms. Retries left: ${retries}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return withRetry(fn, retries - 1, delay * 1.5);
  }
}

export const recipeService = {
  // Get all recipes for the current user
  async getUserRecipes(): Promise<Recipe[]> {
    try {
      console.log("Fetching recipes...");
      
      return await withRetry(async () => {
        const { data, error } = await supabase
          .from("recipes")
          .select(
            `
            *,
            recipe_ingredients (
              *,
              ingredient:ingredients (
                name,
                category,
                emoji
              )
            ),
            recipe_steps (
              *
            ),
            recipe_tags (
              tag:tags (
                name
              )
            ),
            recipe_nutrition (
              *
            ),
            recipe_media (
              *
            )
          `
          )
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching recipes:", error);
          console.error("Error details:", {
            message: error.message,
            details: error.details,
            hint: error.hint,
          });
          throw error;
        }

        console.log("Recipes fetched successfully:", data?.length || 0);
        return data || [];
      });
    } catch (error) {
      console.error("Unexpected error in getUserRecipes:", error);
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },

  // Get a specific recipe by ID
  async getRecipeById(id: string): Promise<RecipeWithDetails | null> {
    try {
      return await withRetry(async () => {
        const { data, error } = await supabase
          .from("recipes")
          .select(
            `
            *,
            recipe_ingredients (
              *,
              ingredient:ingredients (
                name,
                category,
                emoji
              )
            ),
            recipe_steps (
              *
            ),
            recipe_tags (
              tag:tags (
                name
              )
            ),
            recipe_nutrition (
              *
            ),
            recipe_media (
              *
            )
          `
          )
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching recipe:", error);
          throw error;
        }

        return data;
      });
    } catch (error) {
      console.error(`Error fetching recipe ID ${id}:`, error);
      // Return null instead of throwing to prevent app crashes
      return null;
    }
  },

  // Toggle a recipe's favorite status
  async toggleFavorite(recipeId: string, isFavorite: boolean): Promise<void> {
    try {
      return await withRetry(async () => {
        const { error } = await supabase
          .from("recipes")
          .update({ is_favorite: isFavorite })
          .eq("id", recipeId);

        if (error) {
          console.error("Error toggling favorite:", error);
          throw error;
        }
      });
    } catch (error) {
      console.error(`Error toggling favorite for recipe ${recipeId}:`, error);
      throw error;
    }
  },
  
  // Add a new recipe
  async addRecipe(recipe: Partial<Recipe>): Promise<Recipe | null> {
    try {
      return await withRetry(async () => {
        const { data, error } = await supabase
          .from("recipes")
          .insert([recipe])
          .select()
          .single();

        if (error) {
          console.error("Error adding recipe:", error);
          throw error;
        }

        return data;
      });
    } catch (error) {
      console.error("Error adding recipe:", error);
      return null;
    }
  },
  
  // Create a test recipe to verify the connection works
  async createTestRecipe(): Promise<Recipe | null> {
    const testRecipe = {
      title: `Test Recipe ${new Date().toISOString()}`,
      description: "This is a test recipe created to verify connectivity",
      prep_time: 5,
      cook_time: 5,
      servings: 1,
      category: "Test",
      is_favorite: false,
      is_saved: true,
    };
    
    return this.addRecipe(testRecipe);
  },
  
  // Check if we can connect to the recipes table
  async checkConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("recipes")
        .select("count", { count: "exact", head: true });
      
      return !error;
    } catch (error) {
      console.error("Connection check error:", error);
      return false;
    }
  }
};
