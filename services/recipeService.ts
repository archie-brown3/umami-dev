import { supabase } from "../lib/supabase";
import {
  Recipe as DbRecipe,
  RecipeWithDetails,
  RecipeIngredient as DbRecipeIngredient,
  RecipeStep as DbStep,
  RecipeTag as DbRecipeTag,
  Ingredient as DbIngredient,
  Tag as DbTag,
} from "../types/database.types";
import { Recipe, Ingredient } from "../types";
import { Alert } from "react-native";
import { recipeQueries } from "./queries/recipeQueries";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Simpler transformation for recipe list items
function transformRecipeListItem(dbRecipe: Partial<DbRecipe>): Recipe {
  return {
    id: dbRecipe.id || "",
    title: dbRecipe.title || "Untitled Recipe",
    description: dbRecipe.description || undefined,
    imageUrl: dbRecipe.image_url || undefined,
    prepTime: dbRecipe.prep_time ?? 0,
    cookTime: dbRecipe.cook_time ?? 0,
    servings: dbRecipe.servings ?? 0,
    isFavorite: dbRecipe.is_favorite || false,
    createdAt: dbRecipe.created_at || new Date().toISOString(),
    updatedAt: dbRecipe.updated_at || new Date().toISOString(),
    ingredients: [] as Ingredient[],
    instructions: [] as string[],
  };
}

// Fetch a user's recipes and map them to the app's Recipe type
export async function getUserRecipes(userId: string): Promise<Recipe[]> {
  console.log(
    `[recipeService.ts] getUserRecipes: Fetching recipes for userId: ${userId}`
  );
  try {
    const { data, error } = await supabase
      .from("recipes")
      .select(
        `
        id, user_id, title, description, image_url, prep_time, cook_time,
        servings, is_favorite, created_at, updated_at
        `
      )
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(
        "[recipeService.ts] getUserRecipes: Error fetching user recipes from Supabase:",
        JSON.stringify(error, null, 2)
      );
      throw error;
    }
    if (!data) {
      console.log(
        "[recipeService.ts] getUserRecipes: No data returned from Supabase for userId:",
        userId
      );
      return [];
    }
    console.log(
      "[recipeService.ts] getUserRecipes: Raw data from Supabase:",
      JSON.stringify(data, null, 2)
    );

    const transformedRecipes = data.map(transformRecipeListItem);
    console.log(
      "[recipeService.ts] getUserRecipes: Transformed recipes:",
      JSON.stringify(transformedRecipes, null, 2)
    );
    return transformedRecipes;
  } catch (error) {
    console.error(
      "[recipeService.ts] getUserRecipes: Error in service function:",
      error
    );
    throw error;
  }
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying operation. Attempts remaining: ${retries - 1}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay);
    }
    throw error;
  }
}

const CACHE_KEY = "recipe_cache_";
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

// Transform database recipe to app recipe
function transformRecipeToAppFormat(dbRecipe: DbRecipe): Recipe {
  return {
    id: dbRecipe.id,
    title: dbRecipe.title,
    description: dbRecipe.description || "",
    imageUrl: dbRecipe.image_url || "",
    prepTime: dbRecipe.prep_time || 0,
    cookTime: dbRecipe.cook_time || 0,
    servings: dbRecipe.servings || 0,
    ingredients: [], // Will be populated later if needed
    instructions: [], // Will be populated later if needed
    createdAt: dbRecipe.created_at,
    updatedAt: dbRecipe.updated_at,
    isFavorite: dbRecipe.is_favorite || false,
    tags: [], // Will be populated later if needed
    author: dbRecipe.author || undefined,
  };
}

// Transform database recipe with details to app recipe with details
function transformRecipeWithDetailsToAppFormat(
  data: DbRecipe & {
    recipe_steps?: Partial<DbStep>[];
    recipe_ingredients?: (DbRecipeIngredient & {
      ingredients: DbIngredient[];
    })[];
    recipe_tags?: (DbRecipeTag & { tag: DbTag })[];
  }
): Recipe {
  const recipe = transformRecipeToAppFormat(data);

  recipe.ingredients =
    data.recipe_ingredients?.map((ri) => {
      const firstIngredient = ri.ingredients?.[0];
      return {
        id: firstIngredient?.id || ri.id,
        name: firstIngredient?.name || "Unknown ingredient",
        amount: parseFloat(ri.quantity) || 1,
        unit: ri.unit || "",
      };
    }) || [];

  recipe.instructions =
    data.recipe_steps
      ?.sort((a, b) => (a.step_number || 0) - (b.step_number || 0))
      .map((step) => step.instruction)
      .filter((instruction): instruction is string => !!instruction) || [];

  recipe.tags =
    data.recipe_tags?.map((rt) => rt.tag?.name || "").filter(Boolean) || [];

  return recipe;
}

export class RecipeService {
  // Get basic recipe info (lightweight)
  static async getBasicRecipe(recipeId: string): Promise<Recipe | null> {
    try {
      // Check cache first
      const cached = await RecipeService.getCachedRecipe(recipeId);
      if (cached) return cached;

      const { data, error } = await recipeQueries.getBasicRecipe(recipeId);
      if (error) throw error;
      if (!data) return null;
      const recipe = transformRecipeToAppFormat(data as DbRecipe);
      await RecipeService.cacheRecipe(recipeId, recipe);
      return recipe;
    } catch (error) {
      console.error("Error fetching basic recipe:", error);
      return null;
    }
  }

  // Get full recipe details with caching
  static async getRecipeWithDetails(recipeId: string): Promise<Recipe | null> {
    try {
      // Check cache
      const cached = await RecipeService.getCachedRecipe(recipeId);
      if (cached) return cached;

      // Fetch fresh data
      const { data: rawData, error } = await recipeQueries.getRecipeWithDetails(
        recipeId
      );
      if (error) throw error;
      if (!rawData) return null;

      // Assert the shape of the fetched data for transformation
      const recipeDataForTransform = rawData as DbRecipe & {
        recipe_steps?: Partial<DbStep>[];
        recipe_ingredients?: (DbRecipeIngredient & {
          ingredients: DbIngredient[];
        })[];
      };

      // Transform and cache the data
      const recipe = transformRecipeWithDetailsToAppFormat(
        recipeDataForTransform
      );
      await RecipeService.cacheRecipe(recipeId, recipe);
      return recipe;
    } catch (error) {
      console.error("Error fetching recipe details:", error);
      return null;
    }
  }

  // Get recipe list for browsing
  static async getRecipeList(): Promise<Recipe[]> {
    try {
      const { data, error } = await recipeQueries.getRecipeList();
      if (error) throw error;
      if (!data) return [];
      return (data as DbRecipe[]).map(transformRecipeToAppFormat);
    } catch (error) {
      console.error("Error fetching recipe list:", error);
      return [];
    }
  }

  // Progressive loading helpers
  static async loadRecipeSteps(recipeId: string): Promise<DbStep[]> {
    try {
      const { data, error } = await recipeQueries.getRecipeSteps(recipeId);
      if (error) throw error;
      return data?.sort((a, b) => a.step_number - b.step_number) ?? [];
    } catch (error) {
      console.error("Error fetching recipe steps:", error);
      return [];
    }
  }

  static async loadRecipeIngredients(recipeId: string): Promise<
    {
      id: string;
      quantity: string;
      unit: string;
      ingredients: {
        id: string;
        name: string;
        emoji?: string;
      }[];
    }[]
  > {
    try {
      const { data, error } = await recipeQueries.getRecipeIngredients(
        recipeId
      );
      if (error) throw error;
      return data ?? [];
    } catch (error) {
      console.error("Error fetching recipe ingredients:", error);
      return [];
    }
  }

  // Cache helpers
  private static async getCachedRecipe(id: string): Promise<Recipe | null> {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY}${id}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TIME) {
          return data as Recipe;
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  private static async cacheRecipe(id: string, recipe: Recipe): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${CACHE_KEY}${id}`,
        JSON.stringify({
          data: recipe,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      console.error("Error caching recipe:", error);
    }
  }

  static async clearCache(recipeId?: string): Promise<void> {
    try {
      if (recipeId) {
        await AsyncStorage.removeItem(`${CACHE_KEY}${recipeId}`);
      } else {
        const keys = await AsyncStorage.getAllKeys();
        const recipeCacheKeys = keys.filter((key) => key.startsWith(CACHE_KEY));
        await AsyncStorage.multiRemove(recipeCacheKeys);
      }
    } catch (error) {
      console.error("Error clearing recipe cache:", error);
      throw new Error("Failed to clear recipe cache");
    }
  }

  // Remove standalone functions that are now part of the RecipeService class
  static async createRecipe(
    recipe: Partial<RecipeWithDetails>,
    userId: string
  ): Promise<DbRecipe | null> {
    // Implementation needs to be careful about type conversions if it uses main Recipe type
    return null;
  }

  static async updateRecipe(
    recipe: Partial<RecipeWithDetails>
  ): Promise<DbRecipe | null> {
    // Implementation needs to be careful about type conversions
    return null;
  }

  static async deleteRecipe(recipeId: string): Promise<void> {
    // Implementation needs to be careful about type conversions
  }
}

/**
 * Saves a new recipe to the Supabase database.
 * @param recipe The recipe object from the app (expects main Recipe type now).
 * @param userId The ID of the authenticated user.
 * @returns The saved recipe data from the database, or null if an error occurred.
 */
export const addRecipeToSupabase = async (
  recipe: Recipe,
  userId: string | undefined
): Promise<DbRecipe | null> => {
  if (!userId) {
    console.error("User not authenticated. Cannot save recipe.");
    Alert.alert("Error", "You must be logged in to save recipes.");
    return null;
  }

  const recipeDataForDb: Partial<DbRecipe> = {
    user_id: userId,
    title: recipe.title,
    description: recipe.description,
    image_url: recipe.imageUrl,
    prep_time: recipe.prepTime,
    cook_time: recipe.cookTime,
    servings: recipe.servings,
    is_favorite: recipe.isFavorite,
  };

  Object.keys(recipeDataForDb).forEach((keyStr) => {
    const key = keyStr as keyof typeof recipeDataForDb;
    if (recipeDataForDb[key] === undefined) {
      delete recipeDataForDb[key];
    }
  });

  console.log(
    "Attempting to save recipe to DB:",
    JSON.stringify(recipeDataForDb, null, 2)
  );

  const { data, error } = await supabase
    .from("recipes")
    .insert([recipeDataForDb])
    .select()
    .single();

  if (error) {
    console.error("Error saving recipe to Supabase:", error.message);
    console.error("Supabase error details:", error.details);
    console.error("Supabase error hint:", error.hint);
    Alert.alert(
      "Error",
      `Failed to save recipe: ${error.message}. Check console for details.`
    );
    return null;
  }

  console.log("Recipe saved successfully to Supabase:", data);
  return data;
};

// Export the getRecipeWithDetails function directly
export const getRecipeWithDetails = RecipeService.getRecipeWithDetails;
