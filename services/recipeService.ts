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
import {
  emitRecipeCreated,
  emitRecipeUpdated,
  emitRecipeDeleted,
} from "../utils/eventEmitter";

// Helper function to process image URLs and extract original URLs from proxy URLs
function processImageUrl(imageUrl: string | undefined): string | undefined {
  if (!imageUrl) return undefined;

  // If it's a localhost proxy URL, extract the original
  if (imageUrl.includes("localhost") && imageUrl.includes("image-proxy")) {
    try {
      const url = new URL(imageUrl);
      const originalUrl = decodeURIComponent(url.searchParams.get("url") || "");
      if (originalUrl) {
        console.log(
          `[RecipeService] Converted proxy URL to original: ${originalUrl}`
        );

        // For Instagram CDN URLs, use a reliable proxy service
        if (
          originalUrl.includes("cdninstagram.com") ||
          originalUrl.includes("fbcdn.net")
        ) {
          try {
            // Use multiple proxy services as fallbacks
            const proxyServices = [
              `https://images.weserv.nl/?url=${encodeURIComponent(
                originalUrl
              )}&w=640&h=640&fit=cover&output=jpg`,
              `https://wsrv.nl/?url=${encodeURIComponent(
                originalUrl
              )}&w=640&h=640&fit=cover&output=jpg`,
              originalUrl, // Fallback to original URL
            ];

            console.log(
              `[RecipeService] Using proxy service for Instagram CDN: ${proxyServices[0]}`
            );
            return proxyServices[0];
          } catch (proxyError) {
            console.warn(
              `[RecipeService] Failed to generate proxy URL: ${proxyError}`
            );
            return originalUrl;
          }
        }

        return originalUrl;
      }
    } catch (error) {
      console.warn(
        `[RecipeService] Failed to extract original URL from proxy: ${error}`
      );
    }
  }

  // For direct Instagram CDN URLs, also apply proxy
  if (imageUrl.includes("cdninstagram.com") || imageUrl.includes("fbcdn.net")) {
    try {
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(
        imageUrl
      )}&w=640&h=640&fit=cover&output=jpg`;
      console.log(
        `[RecipeService] Applying proxy to direct Instagram URL: ${proxyUrl}`
      );
      return proxyUrl;
    } catch (error) {
      console.warn(`[RecipeService] Failed to proxy Instagram URL: ${error}`);
      return imageUrl;
    }
  }

  return imageUrl;
}

// Simpler transformation for recipe list items
function transformRecipeListItem(dbRecipe: Partial<DbRecipe>): Recipe {
  return {
    id: dbRecipe.id || "",
    title: dbRecipe.title || "Untitled Recipe",
    description: dbRecipe.description || undefined,
    imageUrl: processImageUrl(dbRecipe.image_url),
    prepTime: dbRecipe.prep_time ?? 0,
    cookTime: dbRecipe.cook_time ?? 0,
    servings: dbRecipe.servings ?? 0,
    isFavorite: dbRecipe.is_favorite || false,
    createdAt: dbRecipe.created_at || new Date().toISOString(),
    updatedAt: dbRecipe.updated_at || new Date().toISOString(),
    ingredients: [] as Ingredient[],
    instructions: [] as string[],
    tags: [] as string[], // Initialize empty, will be populated from recipe_tags
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
        servings, is_favorite, created_at, updated_at,
        recipe_tags (
          tag_id,
          tags (
            id,
            name
          )
        )
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

    const transformedRecipes = data.map((dbRecipe) => {
      const recipe = transformRecipeListItem(dbRecipe);
      // Add tags from the database
      recipe.tags =
        dbRecipe.recipe_tags
          ?.map((rt: any) => rt.tags?.name || "")
          .filter(Boolean) || [];
      console.log(
        `[recipeService.ts] Recipe ${recipe.id} has ${recipe.tags.length} tags:`,
        recipe.tags
      );
      return recipe;
    });
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
    imageUrl: processImageUrl(dbRecipe.image_url) || "",
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
  data: any // Using any to avoid type issues with complex nested query result
): Recipe {
  const recipe = transformRecipeToAppFormat(data as DbRecipe);

  console.log(
    `[RecipeService] Transforming recipe with ${
      data.recipe_ingredients?.length || 0
    } ingredients`
  );
  console.log(
    `[RecipeService] Raw ingredients data:`,
    JSON.stringify(data.recipe_ingredients, null, 2)
  );

  console.log(
    `[RecipeService] Raw tags data:`,
    JSON.stringify(data.recipe_tags, null, 2)
  );

  recipe.ingredients =
    data.recipe_ingredients?.map((ri: any, index: number) => {
      // The ingredients field could be either an object or array depending on the query
      const ingredient = Array.isArray(ri.ingredients)
        ? ri.ingredients[0]
        : ri.ingredients;

      console.log(
        `[RecipeService] Processing ingredient ${index + 1}: ${JSON.stringify({
          ingredient_object: ingredient,
          quantity: ri.quantity,
          unit: ri.unit,
        })}`
      );

      const name = ingredient?.name || "Unknown ingredient";
      const amount = parseFloat(ri.quantity) || 1;
      const unit = ri.unit || "";

      console.log(
        `[RecipeService] Transformed ingredient: ${amount} ${unit} ${name}`
      );

      return {
        id: ingredient?.id || ri.id,
        name,
        amount,
        unit,
      };
    }) || [];

  recipe.instructions =
    data.recipe_steps
      ?.sort((a: any, b: any) => (a.step_number || 0) - (b.step_number || 0))
      .map((step: any) => step.instruction)
      .filter((instruction: any): instruction is string => !!instruction) || [];

  recipe.tags =
    data.recipe_tags?.map((rt: any) => rt.tags?.name || "").filter(Boolean) ||
    [];

  console.log(
    `[RecipeService] Final transformed recipe has ${
      recipe.ingredients.length
    } ingredients, ${recipe.instructions.length} instructions, and ${
      recipe.tags?.length || 0
    } tags`
  );

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

      // Transform and cache the data - using any to handle complex nested types
      const recipe = transformRecipeWithDetailsToAppFormat(rawData);
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

  // Process the image URL to avoid localhost issues
  let processedImageUrl = recipe.imageUrl;
  if (processedImageUrl && processedImageUrl.includes("localhost")) {
    // Extract the original URL from the proxy URL
    try {
      const url = new URL(processedImageUrl);
      const originalUrl = decodeURIComponent(url.searchParams.get("url") || "");
      if (originalUrl) {
        processedImageUrl = originalUrl;
        console.log(
          `[RecipeService] Converted localhost proxy URL to original: ${originalUrl}`
        );
      }
    } catch (error) {
      console.warn(
        `[RecipeService] Failed to extract original URL from proxy: ${error}`
      );
      // Keep the original URL if extraction fails
    }
  }

  const recipeDataForDb: Partial<DbRecipe> = {
    user_id: userId,
    title: recipe.title,
    description: recipe.description,
    image_url: processedImageUrl,
    prep_time: recipe.prepTime,
    cook_time: recipe.cookTime,
    servings: recipe.servings,
    is_favorite: recipe.isFavorite,
    author: recipe.author,
    source_url: recipe.sourceUrl,
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

  try {
    // Start a database transaction
    const { data: recipeData, error: recipeError } = await supabase
      .from("recipes")
      .insert([recipeDataForDb])
      .select()
      .single();

    if (recipeError) {
      throw recipeError;
    }

    console.log("Recipe saved successfully to Supabase:", recipeData);

    // Track success/failure for related data
    const results = {
      recipe: true,
      ingredients: false,
      instructions: false,
      tags: false,
    };

    // Save ingredients if they exist
    if (recipe.ingredients && recipe.ingredients.length > 0) {
      try {
        await saveRecipeIngredients(recipeData.id, recipe.ingredients);
        results.ingredients = true;
        console.log(
          `[RecipeService] Successfully saved ${recipe.ingredients.length} ingredients`
        );
      } catch (error) {
        console.error(`[RecipeService] Failed to save ingredients:`, error);
        // Don't fail the entire operation for ingredient errors
      }
    } else {
      results.ingredients = true; // No ingredients to save
    }

    // Save instructions if they exist
    if (recipe.instructions && recipe.instructions.length > 0) {
      try {
        await saveRecipeInstructions(recipeData.id, recipe.instructions);
        results.instructions = true;
        console.log(
          `[RecipeService] Successfully saved ${recipe.instructions.length} instructions`
        );
      } catch (error) {
        console.error(`[RecipeService] Failed to save instructions:`, error);
        // Don't fail the entire operation for instruction errors
      }
    } else {
      results.instructions = true; // No instructions to save
    }

    // Save tags if they exist
    if (recipe.tags && recipe.tags.length > 0) {
      try {
        await saveRecipeTags(recipeData.id, recipe.tags);
        results.tags = true;
        console.log(
          `[RecipeService] Successfully saved ${recipe.tags.length} tags`
        );
      } catch (error) {
        console.error(`[RecipeService] Failed to save tags:`, error);
        // Don't fail the entire operation for tag errors
      }
    } else {
      results.tags = true; // No tags to save
    }

    // Log final results
    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    console.log(
      `[RecipeService] Recipe creation completed: ${successCount}/${totalCount} components saved successfully`,
      results
    );

    // Show warning if some components failed
    if (successCount < totalCount) {
      const failedComponents = Object.entries(results)
        .filter(([_, success]) => !success)
        .map(([component, _]) => component);

      console.warn(
        `[RecipeService] Some recipe components failed to save: ${failedComponents.join(
          ", "
        )}`
      );

      // Still return the recipe data since the main recipe was saved
      Alert.alert(
        "Partial Success",
        `Recipe "${
          recipeData.title
        }" was saved, but some ${failedComponents.join(
          " and "
        )} may not have been saved completely. You can edit the recipe later to add missing information.`
      );
    }

    // Emit event
    emitRecipeCreated(recipeData);

    return recipeData;
  } catch (error: any) {
    console.error("Error saving recipe to Supabase:", error.message);
    console.error("Supabase error details:", error.details);
    console.error("Supabase error hint:", error.hint);

    // Provide more helpful error messages
    let userMessage = `Failed to save recipe: ${error.message}`;
    if (error.code === "23505") {
      userMessage =
        "A recipe with this information already exists. Please modify the title or content and try again.";
    } else if (error.code === "42501") {
      userMessage =
        "You don't have permission to save recipes. Please check your account status.";
    } else if (
      error.message.includes("network") ||
      error.message.includes("connection")
    ) {
      userMessage =
        "Network error. Please check your internet connection and try again.";
    }

    Alert.alert("Error", userMessage);
    return null;
  }
};

/**
 * Save recipe ingredients to the database
 */
async function saveRecipeIngredients(
  recipeId: string,
  ingredients: Ingredient[]
): Promise<void> {
  console.log(
    `[RecipeService] Saving ${ingredients.length} ingredients for recipe ${recipeId}`
  );

  // Use a Set to track processed ingredient names to avoid duplicates
  const processedIngredients = new Set<string>();
  const successfullyLinked: string[] = [];
  const errors: string[] = [];

  for (const ingredient of ingredients) {
    // Skip if we've already processed this ingredient name
    const normalizedName = ingredient.name.trim().toLowerCase();
    if (processedIngredients.has(normalizedName)) {
      console.log(
        `[RecipeService] Skipping duplicate ingredient: ${ingredient.name}`
      );
      continue;
    }
    processedIngredients.add(normalizedName);

    try {
      // Use upsert to create or get existing ingredient
      const { data: upsertedIngredient, error: upsertError } = await supabase
        .from("ingredients")
        .upsert(
          { name: ingredient.name.trim() },
          {
            onConflict: "name",
            ignoreDuplicates: false,
          }
        )
        .select("id")
        .single();

      if (upsertError) {
        throw upsertError;
      }

      const ingredientId = upsertedIngredient.id;
      console.log(
        `[RecipeService] Upserted ingredient: ${ingredient.name} with ID: ${ingredientId}`
      );

      // Create the recipe-ingredient relationship with conflict handling
      const { error: linkError } = await supabase
        .from("recipe_ingredients")
        .upsert(
          {
            recipe_id: recipeId,
            ingredient_id: ingredientId,
            quantity: ingredient.amount.toString(),
            unit: ingredient.unit || "",
          },
          {
            onConflict: "recipe_id,ingredient_id",
            ignoreDuplicates: true,
          }
        );

      if (linkError) {
        // If it's a duplicate constraint error, just log it and continue
        if (linkError.code === "23505") {
          console.log(
            `[RecipeService] Ingredient ${ingredient.name} already linked to recipe ${recipeId}, skipping`
          );
        } else {
          throw linkError;
        }
      } else {
        console.log(
          `[RecipeService] Linked ingredient ${ingredient.name} to recipe ${recipeId}`
        );
        successfullyLinked.push(ingredient.name);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[RecipeService] Error processing ingredient ${ingredient.name}:`,
        error
      );
      errors.push(`${ingredient.name}: ${errorMessage}`);
    }
  }

  console.log(
    `[RecipeService] Ingredient processing complete. Successfully linked: ${successfullyLinked.length}, Errors: ${errors.length}`
  );

  if (errors.length > 0) {
    console.warn(`[RecipeService] Some ingredients failed to save:`, errors);
    // Don't throw here - partial success is acceptable
  }
}

/**
 * Save recipe instructions to the database
 */
async function saveRecipeInstructions(
  recipeId: string,
  instructions: string[]
): Promise<void> {
  console.log(
    `[RecipeService] Saving ${instructions.length} instructions for recipe ${recipeId}`
  );

  const instructionData = instructions.map((instruction, index) => ({
    recipe_id: recipeId,
    step_number: index + 1,
    instruction: instruction,
  }));

  const { error } = await supabase.from("recipe_steps").insert(instructionData);

  if (error) {
    console.error(`[RecipeService] Error saving instructions:`, error);
    throw error;
  }

  console.log(
    `[RecipeService] Successfully saved ${instructions.length} instructions`
  );
}

/**
 * Save recipe tags to the database
 */
async function saveRecipeTags(recipeId: string, tags: string[]): Promise<void> {
  console.log(
    `[RecipeService] Saving ${tags.length} tags for recipe ${recipeId}`
  );

  // Filter out empty tags and remove duplicates
  const uniqueTags = [
    ...new Set(tags.filter((tag) => tag && tag.trim().length > 0)),
  ];
  const successfullyLinked: string[] = [];
  const errors: string[] = [];

  for (const tagName of uniqueTags) {
    try {
      const trimmedTagName = tagName.trim();

      // Use upsert to create or get existing tag
      const { data: upsertedTag, error: upsertError } = await supabase
        .from("tags")
        .upsert(
          { name: trimmedTagName },
          {
            onConflict: "name",
            ignoreDuplicates: false,
          }
        )
        .select("id")
        .single();

      if (upsertError) {
        throw upsertError;
      }

      const tagId = upsertedTag.id;
      console.log(
        `[RecipeService] Upserted tag: ${trimmedTagName} with ID: ${tagId}`
      );

      // Create the recipe-tag relationship with conflict handling
      const { error: linkError } = await supabase.from("recipe_tags").upsert(
        {
          recipe_id: recipeId,
          tag_id: tagId,
        },
        {
          onConflict: "recipe_id,tag_id",
          ignoreDuplicates: true,
        }
      );

      if (linkError) {
        // If it's a duplicate constraint error, just log it and continue
        if (linkError.code === "23505") {
          console.log(
            `[RecipeService] Tag ${trimmedTagName} already linked to recipe ${recipeId}, skipping`
          );
        } else {
          throw linkError;
        }
      } else {
        console.log(
          `[RecipeService] Linked tag ${trimmedTagName} to recipe ${recipeId}`
        );
        successfullyLinked.push(trimmedTagName);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`[RecipeService] Error processing tag ${tagName}:`, error);
      errors.push(`${tagName}: ${errorMessage}`);
    }
  }

  console.log(
    `[RecipeService] Tag processing complete. Successfully linked: ${successfullyLinked.length}, Errors: ${errors.length}`
  );

  if (errors.length > 0) {
    console.warn(`[RecipeService] Some tags failed to save:`, errors);
    // Don't throw here - partial success is acceptable
  }
}

// Export the getRecipeWithDetails function directly
export const getRecipeWithDetails = RecipeService.getRecipeWithDetails;
