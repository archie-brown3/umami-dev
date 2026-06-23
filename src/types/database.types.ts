export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  image_url?: string;
  prep_time?: number;
  cook_time?: number;
  category?: string;
  source?: string;
  source_url?: string;
  author?: string;
  total_cost?: number;
  cost_per_serving?: number;
  price_confidence?: number;
  instagram_username?: string;
  instagram_profile_pic?: string;
  servings: number;
  is_favorite: boolean;
  is_saved: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipeStep {
  id: string;
  recipe_id: string;
  step_number: number;
  instruction: string;
  created_at: string;
  updated_at: string;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: string;
  unit: string;
  cost?: number;
  package_size?: string;
  package_price?: number;
  portion_used?: number;
  price_confidence?: number;
  created_at: string;
  updated_at: string;
  ingredient?: Ingredient;
}

export interface Ingredient {
  id: string;
  name: string;
  category?: string;
  emoji?: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface RecipeTag {
  recipe_id: string;
  tag_id: string;
  tag?: Tag;
}

// Frontend representation
export interface RecipeWithDetails extends Recipe {
  steps: RecipeStep[];
  ingredients: (RecipeIngredient & { ingredient: Ingredient })[];
  tags: string[];
}
