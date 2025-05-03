export interface Recipe {
  id: string;
  title: string;
  description?: string;
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  category?: string;
  source?: string;
  source_url?: string;
  author?: string;
  image_url?: string;
  is_favorite: boolean;
  is_saved: boolean;
  total_cost?: number;
  cost_per_serving?: number;
  price_confidence?: number;
  instagram_username?: string;
  instagram_profile_picture?: string;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  category?: string;
  emoji?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity?: string;
  unit?: string;
  cost?: number;
  package_size?: string;
  package_price?: number;
  portion_used?: number;
  price_confidence?: number;
  created_at?: string;
  updated_at?: string;
  ingredient?: Ingredient;
}

export interface RecipeStep {
  id: string;
  recipe_id: string;
  instruction: string;
  step_number: number;
  created_at?: string;
}

export interface Tag {
  id: string;
  name: string;
  created_at?: string;
}

export interface RecipeTag {
  recipe_id: string;
  tag_id: string;
  tag?: Tag;
}

export interface RecipeNutrition {
  id: string;
  recipe_id: string;
  calories?: number;
  protein?: string;
  carbs?: string;
  fat?: string;
  fiber?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RecipeMedia {
  id: string;
  recipe_id: string;
  url: string;
  is_video?: boolean;
  video_url?: string;
  order_index?: number;
  created_at?: string;
}

export interface RecipeWithDetails extends Recipe {
  recipe_ingredients?: RecipeIngredient[];
  recipe_steps?: RecipeStep[];
  recipe_tags?: RecipeTag[];
  recipe_nutrition?: RecipeNutrition;
  recipe_media?: RecipeMedia[];
}

export interface NewRecipe {
  title: string;
  description: string;
  prep_time: string;
  cook_time: string;
  servings: string;
  ingredients: {
    name: string;
    quantity: string;
    unit: string;
  }[];
  steps: {
    instruction: string;
  }[];
}
