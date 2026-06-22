import { Recipe, MealPlan, ShoppingList, ShoppingItem, InventoryItem } from "@/types";
import { demoRecipes, demoShoppingLists, demoShoppingItems, demoInventoryItems, demoUser } from "./demoData";
import { MealPlanItem, WeekMeals } from "@/context/mealPlanTypes";

let recipes = [...demoRecipes];
let shoppingLists = [...demoShoppingLists];
let shoppingItems = [...demoShoppingItems];
let inventoryItems = [...demoInventoryItems];

let mealPlanItems: MealPlanItem[] = [
  {
    id: "mpi-1",
    meal_plan_id: "mp-1",
    recipe_id: "demo-recipe-4",
    meal_type: "breakfast",
    created_at: "2025-06-23T06:00:00.000Z",
  },
  {
    id: "mpi-2",
    meal_plan_id: "mp-1",
    recipe_id: "demo-recipe-6",
    meal_type: "breakfast",
    created_at: "2025-06-24T06:00:00.000Z",
  },
  {
    id: "mpi-3",
    meal_plan_id: "mp-1",
    recipe_id: "demo-recipe-1",
    meal_type: "dinner",
    created_at: "2025-06-23T18:00:00.000Z",
  },
  {
    id: "mpi-4",
    meal_plan_id: "mp-1",
    recipe_id: "demo-recipe-2",
    meal_type: "dinner",
    created_at: "2025-06-24T18:00:00.000Z",
  },
  {
    id: "mpi-5",
    meal_plan_id: "mp-1",
    recipe_id: "demo-recipe-5",
    meal_type: "dinner",
    created_at: "2025-06-25T18:00:00.000Z",
  },
  {
    id: "mpi-6",
    meal_plan_id: "mp-1",
    recipe_id: "demo-recipe-7",
    meal_type: "dinner",
    created_at: "2025-06-26T18:00:00.000Z",
  },
  {
    id: "mpi-7",
    meal_plan_id: "mp-1",
    recipe_id: "demo-recipe-3",
    meal_type: "dinner",
    created_at: "2025-06-27T18:00:00.000Z",
  },
  {
    id: "mpi-8",
    meal_plan_id: "mp-1",
    recipe_id: "demo-recipe-4",
    meal_type: "lunch",
    created_at: "2025-06-25T12:00:00.000Z",
  },
];

let idCounter = 1000;

function nextId(): string {
  return `local-${Date.now()}-${++idCounter}`;
}

export const demoStore = {
  getUser: () => ({ ...demoUser }),
  getRecipes: (): Recipe[] => [...recipes],
  getRecipeById: (id: string): Recipe | undefined => recipes.find((r) => r.id === id),

  addRecipe: (recipe: Recipe): Recipe => {
    const newRecipe = { ...recipe, id: recipe.id || nextId() };
    recipes = [newRecipe, ...recipes];
    return newRecipe;
  },

  updateRecipe: (id: string, updates: Partial<Recipe>): Recipe | null => {
    const idx = recipes.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    recipes[idx] = { ...recipes[idx], ...updates, updatedAt: new Date().toISOString() };
    return recipes[idx];
  },

  removeRecipe: (id: string): boolean => {
    const len = recipes.length;
    recipes = recipes.filter((r) => r.id !== id);
    return recipes.length < len;
  },

  getShoppingLists: (): ShoppingList[] => [...shoppingLists],

  getShoppingItems: (listId: string): ShoppingItem[] =>
    shoppingItems.filter((item) => item.shopping_list_id === listId),

  addShoppingList: (list: ShoppingList): ShoppingList => {
    const newList = { ...list, id: list.id || nextId() };
    shoppingLists = [...shoppingLists, newList];
    return newList;
  },

  updateShoppingList: (id: string, updates: Partial<ShoppingList>): ShoppingList | null => {
    const idx = shoppingLists.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    shoppingLists[idx] = { ...shoppingLists[idx], ...updates, updated_at: new Date().toISOString() };
    return shoppingLists[idx];
  },

  removeShoppingList: (id: string): void => {
    shoppingLists = shoppingLists.filter((l) => l.id !== id);
    shoppingItems = shoppingItems.filter((i) => i.shopping_list_id !== id);
  },

  addShoppingItem: (item: Partial<ShoppingItem> & { name: string }): ShoppingItem => {
    const newItem: ShoppingItem = {
      id: nextId(),
      shopping_list_id: item.shopping_list_id || "",
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      checked: item.checked ?? false,
      recipe_id: item.recipe_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    shoppingItems = [...shoppingItems, newItem];
    return newItem;
  },

  updateShoppingItem: (itemId: string, updates: Partial<ShoppingItem>): ShoppingItem | null => {
    const idx = shoppingItems.findIndex((i) => i.id === itemId);
    if (idx === -1) return null;
    shoppingItems[idx] = { ...shoppingItems[idx], ...updates, updated_at: new Date().toISOString() };
    return shoppingItems[idx];
  },

  removeShoppingItem: (itemId: string): void => {
    shoppingItems = shoppingItems.filter((i) => i.id !== itemId);
  },

  getMealPlanItems: (): MealPlanItem[] => [...mealPlanItems],

  addMealPlanItem: (userId: string, date: string, item: { recipe_id: string; meal_type: string }): MealPlanItem => {
    const newItem: MealPlanItem = {
      id: nextId(),
      meal_plan_id: "mp-1",
      recipe_id: item.recipe_id,
      meal_type: item.meal_type as "breakfast" | "lunch" | "dinner" | "snack",
      created_at: new Date().toISOString(),
    };
    mealPlanItems = [...mealPlanItems, newItem];
    return newItem;
  },

  removeMealPlanItem: (itemId: string): void => {
    mealPlanItems = mealPlanItems.filter((i) => i.id !== itemId);
  },

  getMealPlansForWeek: (userId: string, weekStart: string): WeekMeals => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const endStr = weekEnd.toISOString().split("T")[0];

    const weekMeals: WeekMeals = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      weekMeals[dateStr] = { breakfast: [], lunch: [], dinner: [], snack: [] };
    }

    mealPlanItems.forEach((item) => {
      const itemDate = item.created_at.split("T")[0];
      if (itemDate >= weekStart && itemDate <= endStr) {
        const day = itemDate;
        if (!weekMeals[day]) {
          weekMeals[day] = { breakfast: [], lunch: [], dinner: [], snack: [] };
        }
        const mealType = item.meal_type as "breakfast" | "lunch" | "dinner" | "snack";
        weekMeals[day][mealType] = [...(weekMeals[day][mealType] || []), item];
      }
    });

    return weekMeals;
  },

  getInventoryItems: (): InventoryItem[] => [...inventoryItems],

  addInventoryItem: (item: Partial<InventoryItem> & { name: string }): InventoryItem => {
    const newItem: InventoryItem = {
      id: nextId(),
      user_id: demoUser.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      expiration_date: item.expiration_date,
      added_date: new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    inventoryItems = [...inventoryItems, newItem];
    return newItem;
  },

  updateInventoryItem: (itemId: string, updates: Partial<InventoryItem>): InventoryItem | null => {
    const idx = inventoryItems.findIndex((i) => i.id === itemId);
    if (idx === -1) return null;
    inventoryItems[idx] = { ...inventoryItems[idx], ...updates, updated_at: new Date().toISOString() };
    return inventoryItems[idx];
  },

  removeInventoryItem: (itemId: string): void => {
    inventoryItems = inventoryItems.filter((i) => i.id !== itemId);
  },

  getDemoUserStats: () => ({
    totalRecipes: recipes.length,
    favoriteRecipes: recipes.filter((r) => r.isFavorite).length,
    recentlyAdded: recipes.filter((r) => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return new Date(r.createdAt) > oneWeekAgo;
    }).length,
    joinedDate: demoUser.created_at,
  }),
};
