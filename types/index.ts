export interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  imageUrl?: string;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlan {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  recipes: string[]; // Array of recipe IDs
  createdAt: string;
  updatedAt: string;
}

export interface RecipeContextType {
  recipes: Recipe[];
  addRecipe: (recipe: Recipe) => Promise<Recipe>;
  removeRecipe: (id: string) => Promise<void>;
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<void>;
  mealPlans: MealPlan[];
  addMealPlan: (mealPlan: MealPlan) => Promise<void>;
  removeMealPlan: (id: string) => Promise<void>;
  updateMealPlan: (id: string, updates: Partial<MealPlan>) => Promise<void>;
}

// Shopping List Types
export interface ShoppingList {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingItem {
  id: string;
  shopping_list_id: string;
  name: string;
  quantity?: string;
  unit?: string;
  category?: string;
  checked: boolean;
  recipe_id?: string;
  created_at: string;
  updated_at: string;
}

// Inventory Types
export interface InventoryItem {
  id: string;
  user_id: string;
  name: string;
  quantity?: string;
  unit?: string;
  category?: string;
  expiration_date?: string;
  added_date: string;
  created_at: string;
  updated_at: string;
}

// Context Types
export interface ShoppingListContextType {
  shoppingLists: ShoppingList[];
  currentListItems: ShoppingItem[];
  currentListId?: string;
  loading: boolean;
  error: string | null;
  fetchShoppingLists: () => Promise<void>;
  fetchShoppingItems: (listId: string) => Promise<void>;
  createList: (name: string) => Promise<void>;
  updateList: (listId: string, name: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  addItemToList: (listId: string, item: Partial<ShoppingItem>) => Promise<void>;
  updateItem: (itemId: string, updates: Partial<ShoppingItem>) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  clearCheckedItems: (listId: string) => Promise<void>;
  setCurrentListId: (listId: string | undefined) => void;
}

export interface InventoryContextType {
  inventoryItems: InventoryItem[];
  loading: boolean;
  error: string | null;
  fetchInventoryItems: () => Promise<void>;
  addItem: (item: Partial<InventoryItem>) => Promise<void>;
  updateItem: (
    itemId: string,
    updates: Partial<InventoryItem>
  ) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  getExpiringItems: (daysUntilExpiration?: number) => Promise<InventoryItem[]>;
}
