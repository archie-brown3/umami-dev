import { supabase } from "@/lib/supabase";

// Basic recipe fields that are always needed
const RECIPE_BASE_FIELDS = `
  id,
  user_id,
  author,
  title,
  description,
  image_url,
  prep_time,
  cook_time,
  servings,
  is_favorite,
  is_saved,
  author,
  created_at,
  updated_at
`;

// Recipe steps fields
const RECIPE_STEPS = `
  recipe_steps (
    id,
    step_number,
    instruction
  )
`;

// Recipe ingredients with their base ingredient info
const RECIPE_INGREDIENTS = `
  recipe_ingredients (
    id,
    quantity,
    unit,
    ingredients (
      id,
      name,
      emoji
    )
  )
`;

export const recipeQueries = {
  // Get basic recipe info (lightweight)
  getBasicRecipe: (recipeId: string) =>
    supabase
      .from("recipes")
      .select(RECIPE_BASE_FIELDS)
      .eq("id", recipeId)
      .single(),

  // Get full recipe details (heavy)
  getRecipeWithDetails: (recipeId: string) =>
    supabase
      .from("recipes")
      .select(
        `
        ${RECIPE_BASE_FIELDS},
        ${RECIPE_STEPS},
        ${RECIPE_INGREDIENTS}
      `
      )
      .eq("id", recipeId)
      .single(),

  // Get recipe list (for browsing)
  getRecipeList: () =>
    supabase
      .from("recipes")
      .select(RECIPE_BASE_FIELDS)
      .order("created_at", { ascending: false })
      .limit(20),

  // Get recipe steps only
  getRecipeSteps: (recipeId: string) =>
    supabase
      .from("recipe_steps")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("step_number", { ascending: true }),

  // Get recipe ingredients only
  getRecipeIngredients: (recipeId: string) =>
    supabase
      .from("recipe_ingredients")
      .select(
        `
        id,
        quantity,
        unit,
        ingredients (
          id,
          name,
          emoji
        )
      `
      )
      .eq("recipe_id", recipeId),
};
