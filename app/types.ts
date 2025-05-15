export interface Recipe {
  id: string;
  title: string;
  name?: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string;
  tags?: string[];
  cuisine?: string;
  difficulty?: string;
  category?: string;
  author?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  notes?: string;
}

export interface CupboardItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate?: Date;
  category?: string;
}

export interface CupboardContextType {
  items: CupboardItem[];
  addItem: (item: CupboardItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, item: Partial<CupboardItem>) => void;
}

export interface MealPlan {
  id: string;
  date: Date;
  meals: {
    breakfast?: Recipe;
    lunch?: Recipe;
    dinner?: Recipe;
    snacks?: Recipe[];
  };
}

export interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: Recipe) => void;
  removeRecipe: (id: string) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  mealPlans: MealPlan[];
  addMealPlan: (mealPlan: MealPlan) => void;
  removeMealPlan: (id: string) => void;
  updateMealPlan: (id: string, mealPlan: Partial<MealPlan>) => void;
}

export interface IngredientDetails {
  id: string;
  name: string;
  nutrients: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
  };
  servingSize: {
    amount: number;
    unit: string;
  };
}
