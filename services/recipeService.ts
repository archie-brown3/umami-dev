import { supabase } from "../lib/supabase";
import {
  Recipe,
  RecipeWithDetails,
  RecipeIngredient,
  Step,
  RecipeTag,
} from "../types/database.types";

// Fetch a user's recipes
export async function getUserRecipes(userId: string) {
  try {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data as Recipe[];
  } catch (error) {
    console.error("Error fetching recipes:", error);
    throw error;
  }
}

// Get a single recipe with all related data
export async function getRecipeWithDetails(
  recipeId: string
): Promise<RecipeWithDetails | null> {
  try {
    // Fetch the recipe
    const { data: recipe, error: recipeError } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", recipeId)
      .single();

    if (recipeError) throw recipeError;
    if (!recipe) return null;

    // Fetch ingredients with their details
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

    // Fetch steps
    const { data: steps, error: stepsError } = await supabase
      .from("steps")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("order_index", { ascending: true });

    if (stepsError) throw stepsError;

    // Fetch tags
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

    // Transform to frontend model
    return transformRecipe(
      recipe,
      recipeIngredients as RecipeIngredient[],
      steps as Step[],
      recipeTags as RecipeTag[]
    );
  } catch (error) {
    console.error("Error fetching recipe details:", error);
    throw error;
  }
}

// Transform database model to frontend model
function transformRecipe(
  recipe: Recipe,
  recipeIngredients: RecipeIngredient[],
  steps: Step[],
  recipeTags: RecipeTag[]
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
    isFavorite: recipe.is_favorite,
    isSaved: recipe.is_saved,
    createdAt: new Date(recipe.created_at),
    updatedAt: new Date(recipe.updated_at),
    ingredients: recipeIngredients.map((ri) => ({
      id: ri.id,
      name: ri.ingredient?.name || "Unknown",
      quantity: ri.quantity,
      unit: ri.unit,
      category: ri.ingredient?.category || undefined,
      emoji: ri.ingredient?.emoji || undefined,
    })),
    steps: steps.map((step) => ({
      description: step.description,
      orderIndex: step.order_index,
    })),
    tags: recipeTags.map((rt) => rt.tag?.name || ""),
  };
}

// Create a new recipe
export async function createRecipe(
  recipe: Partial<RecipeWithDetails>,
  userId: string
) {
  // Implementation details would go here
  // This would involve inserting the recipe and related data
}

// Update a recipe
export async function updateRecipe(recipe: Partial<RecipeWithDetails>) {
  // Implementation details would go here
}

// Delete a recipe
export async function deleteRecipe(recipeId: string) {
  // Implementation details would go here
}
