import { supabase } from "../lib/supabase";
import {
  Recipe as DbRecipe,
  RecipeWithDetails,
  RecipeIngredient as DbRecipeIngredient,
  Step as DbStep,
  RecipeTag as DbRecipeTag,
  Ingredient as DbIngredient,
  Tag as DbTag,
} from "../types/database.types";
import { Recipe, Ingredient } from "../types";
import { Alert } from "react-native";

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

// Get a single recipe with all related data
export async function getRecipeWithDetails(
  recipeId: string
): Promise<RecipeWithDetails | null> {
  try {
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", recipeId)
      .single();

    if (recipeError) throw recipeError;
    if (!recipe) return null;

    const { data: recipeIngredients, error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .select(
        `
        *,
        ingredient:ingredients(*)
      `
      )
      .eq("recipe_id", recipeId);

    if (ingredientsError) throw ingredientsError;

    const { data: steps, error: stepsError } = await supabase
      .from("steps")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("order_index", { ascending: true });

    if (stepsError) throw stepsError;

    const { data: recipeTags, error: tagsError } = await supabase
      .from("recipe_tags")
      .select(
        `
        *,
        tag:tags(*)
      `
      )
      .eq("recipe_id", recipeId);

    if (tagsError) throw tagsError;

    return transformRecipeToDetails(
      recipe,
      recipeIngredients as Array<
        DbRecipeIngredient & { ingredient: DbIngredient | null }
      >,
      steps as DbStep[],
      recipeTags as Array<DbRecipeTag & { tag: DbTag | null }>
    );
  } catch (error) {
    console.error("Error fetching recipe details:", error);
    throw error;
  }
}

// Transform database model to RecipeWithDetails (from database.types.ts)
function transformRecipeToDetails(
  recipe: DbRecipe,
  recipeIngredients: Array<
    DbRecipeIngredient & { ingredient: DbIngredient | null }
  >,
  steps: DbStep[],
  recipeTags: Array<DbRecipeTag & { tag: DbTag | null }>
): RecipeWithDetails {
  return {
    id: recipe.id,
    userId: recipe.user_id,
    title: recipe.title,
    description: recipe.description,
    imageUrl: recipe.image_url,
    prepTime: recipe.prep_time,
    cookTime: recipe.cook_time,
    servings: recipe.servings,
    category: recipe.category,
    source: recipe.source,
    sourceUrl: recipe.source_url,
    author: recipe.author,
    isFavorite: recipe.is_favorite || false,
    isSaved: recipe.is_saved || false,
    createdAt: new Date(recipe.created_at),
    updatedAt: new Date(recipe.updated_at),
    ingredients: recipeIngredients.map((ri) => ({
      id: ri.id,
      name: ri.ingredient?.name || "Unknown Ingredient",
      quantity: ri.quantity,
      unit: ri.unit,
      category: ri.ingredient?.category || undefined,
      emoji: ri.ingredient?.emoji || undefined,
    })),
    steps: steps.map((step) => ({
      id: step.id,
      recipe_id: step.recipe_id,
      description: step.description,
      order_index: step.order_index,
    })),
    tags: recipeTags.map((rt) => ({
      recipe_id: rt.recipe_id,
      tag_id: rt.tag_id,
      tag: rt.tag
        ? {
            id: rt.tag.id,
            name: rt.tag.name,
            created_at: rt.tag.created_at,
            updated_at: rt.tag.updated_at,
          }
        : undefined,
    })),
  };
}

// Create a new recipe
export async function createRecipe(
  recipe: Partial<RecipeWithDetails>,
  userId: string
) {
  // Implementation needs to be careful about type conversions if it uses main Recipe type
}

// Update a recipe
export async function updateRecipe(recipe: Partial<RecipeWithDetails>) {
  // Implementation needs to be careful about type conversions
}

// Delete a recipe
export async function deleteRecipe(recipeId: string) {}

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
