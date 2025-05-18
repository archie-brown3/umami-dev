export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  prep_time: number | null;
  cook_time: number | null;
  servings: number | null;
  category: string | null;
  source: string | null;
  source_url: string | null;
  author: string | null;
  is_favorite: boolean;
  is_saved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ingredient {
  id: string;
  name: string;
  category: string | null;
  emoji: string | null;
}

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: string;
  unit: string;
  ingredient?: Ingredient;
}

export interface Step {
  id: string;
  recipe_id: string;
  description: string;
  order_index: number;
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
export interface RecipeWithDetails {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  prepTime: number | null;
  cookTime: number | null;
  servings: number | null;
  category: string | null;
  source: string | null;
  sourceUrl: string | null;
  author: string | null;
  isFavorite: boolean;
  isSaved: boolean;
  createdAt: Date;
  updatedAt: Date;
  ingredients: Array<{
    id: string;
    name: string;
    quantity: string;
    unit: string;
    category?: string;
    emoji?: string;
  }>;
  steps: Array<{
    description: string;
    orderIndex: number;
  }>;
  tags: string[];
}
