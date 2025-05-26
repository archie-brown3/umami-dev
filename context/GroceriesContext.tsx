import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Recipe } from "../types";
import { useAuth } from "./AuthContext";
import {
  ShoppingList,
  ShoppingItem as SupabaseShoppingItem,
  getShoppingLists,
  createShoppingList,
  addShoppingItem as addSupabaseShoppingItem,
  updateShoppingItem,
  removeShoppingItem as removeSupabaseShoppingItem,
  consolidateShoppingListItems,
} from "@/services/groceriesService";
import { getUserRecipesWithIngredients } from "@/services/recipeService";

// Type definitions
export interface GroceryItem {
  id: string;
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingItem extends GroceryItem {
  checked: boolean;
  recipeId?: string;
}

export interface CupboardItem extends GroceryItem {
  expirationDate?: Date;
}

interface GroceriesContextType {
  // State
  shoppingList: ShoppingItem[];
  cupboardItems: CupboardItem[];
  selectedRecipes: Recipe[];
  activeView: "shopping" | "cupboard";
  isLoading: boolean;
  error: string | null;

  // Default shopping list (no more multiple lists)
  defaultShoppingList: ShoppingList | null;

  // Recipes with ingredients for shopping list
  recipesWithIngredients: Recipe[];
  loadRecipesWithIngredients: () => Promise<void>;

  // Actions
  setActiveView: (view: "shopping" | "cupboard") => void;
  addShoppingItem: (
    item: Omit<ShoppingItem, "id" | "createdAt" | "updatedAt">
  ) => void;
  removeShoppingItem: (id: string) => void;
  toggleShoppingItem: (id: string) => void;
  addCupboardItem: (
    item: Omit<CupboardItem, "id" | "createdAt" | "updatedAt">
  ) => void;
  removeCupboardItem: (id: string) => void;
  updateCupboardItem: (id: string, updates: Partial<CupboardItem>) => void;
  moveCheckedItemsToCupboard: () => void;
  addSelectedRecipe: (recipe: Recipe) => void;
  removeSelectedRecipe: (recipeId: string) => void;
  clearError: () => void;

  // New simplified methods
  addItemToShoppingList: (item: Partial<SupabaseShoppingItem>) => Promise<void>;
  updateShoppingItemInList: (
    itemId: string,
    updates: Partial<SupabaseShoppingItem>
  ) => Promise<void>;
  toggleItemInShoppingList: (itemId: string) => Promise<void>;
  removeItemFromShoppingList: (itemId: string) => Promise<void>;
  addRecipeToShoppingList: (recipe: Recipe) => Promise<void>;
  removeRecipeFromShoppingList: (recipeId: string) => Promise<void>;
  refreshShoppingList: () => Promise<void>;
}

const STORAGE_KEYS = {
  SHOPPING_LIST: "groceries.shoppingList",
  CUPBOARD_ITEMS: "groceries.cupboardItems",
  SELECTED_RECIPES: "groceries.selectedRecipes",
};

const GroceriesContext = createContext<GroceriesContextType | undefined>(
  undefined
);

export const GroceriesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [cupboardItems, setCupboardItems] = useState<CupboardItem[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [activeView, setActiveView] = useState<"shopping" | "cupboard">(
    "shopping"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default shopping list (no more multiple lists)
  const [defaultShoppingList, setDefaultShoppingList] =
    useState<ShoppingList | null>(null);

  // Recipes with ingredients for shopping list
  const [recipesWithIngredients, setRecipesWithIngredients] = useState<
    Recipe[]
  >([]);

  // Load data from AsyncStorage on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [shoppingData, cupboardData, selectedRecipesData] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.SHOPPING_LIST),
            AsyncStorage.getItem(STORAGE_KEYS.CUPBOARD_ITEMS),
            AsyncStorage.getItem(STORAGE_KEYS.SELECTED_RECIPES),
          ]);

        if (shoppingData) {
          const parsedData = JSON.parse(shoppingData);
          // Convert string dates to Date objects
          const formattedData = parsedData.map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
          }));
          setShoppingList(formattedData);
        }

        if (cupboardData) {
          const parsedData = JSON.parse(cupboardData);
          // Convert string dates to Date objects
          const formattedData = parsedData.map((item: any) => ({
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
            expirationDate: item.expirationDate
              ? new Date(item.expirationDate)
              : undefined,
          }));
          setCupboardItems(formattedData);
        }

        if (selectedRecipesData) {
          const parsedData = JSON.parse(selectedRecipesData);
          setSelectedRecipes(parsedData);
        }
      } catch (error) {
        console.error("[GroceriesContext] Error loading data:", error);
        setError("Failed to load grocery data. Please restart the app.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Save shopping list data to AsyncStorage when it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.SHOPPING_LIST,
          JSON.stringify(shoppingList)
        );
      } catch (error) {
        console.error("[GroceriesContext] Error saving shopping list:", error);
        setError("Failed to save shopping list changes.");
      }
    };

    if (shoppingList.length > 0) {
      saveData();
    }
  }, [shoppingList]);

  // Save cupboard data to AsyncStorage when it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.CUPBOARD_ITEMS,
          JSON.stringify(cupboardItems)
        );
      } catch (error) {
        console.error("[GroceriesContext] Error saving cupboard items:", error);
        setError("Failed to save cupboard changes.");
      }
    };

    if (cupboardItems.length > 0) {
      saveData();
    }
  }, [cupboardItems]);

  // Save selected recipes data to AsyncStorage when it changes
  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.SELECTED_RECIPES,
          JSON.stringify(selectedRecipes)
        );
      } catch (error) {
        console.error(
          "[GroceriesContext] Error saving selected recipes:",
          error
        );
        setError("Failed to save selected recipes.");
      }
    };

    if (selectedRecipes.length > 0) {
      saveData();
    }
  }, [selectedRecipes]);

  const clearError = () => setError(null);

  const addShoppingItem = (
    item: Omit<ShoppingItem, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const now = new Date();
      const newItem: ShoppingItem = {
        ...item,
        id: now.getTime().toString(),
        createdAt: now,
        updatedAt: now,
      };
      setShoppingList((prev) => [...prev, newItem]);
    } catch (error) {
      console.error("[GroceriesContext] Error adding shopping item:", error);
      setError("Failed to add item to shopping list.");
    }
  };

  const removeShoppingItem = (id: string) => {
    try {
      setShoppingList((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("[GroceriesContext] Error removing shopping item:", error);
      setError("Failed to remove item from shopping list.");
    }
  };

  const toggleShoppingItem = (id: string) => {
    try {
      setShoppingList((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, checked: !item.checked, updatedAt: new Date() }
            : item
        )
      );
    } catch (error) {
      console.error("[GroceriesContext] Error toggling shopping item:", error);
      setError("Failed to update shopping item.");
    }
  };

  const addCupboardItem = (
    item: Omit<CupboardItem, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const now = new Date();
      const newItem: CupboardItem = {
        ...item,
        id: now.getTime().toString(),
        createdAt: now,
        updatedAt: now,
      };
      setCupboardItems((prev) => [...prev, newItem]);
    } catch (error) {
      console.error("[GroceriesContext] Error adding cupboard item:", error);
      setError("Failed to add item to cupboard.");
    }
  };

  const removeCupboardItem = (id: string) => {
    try {
      setCupboardItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("[GroceriesContext] Error removing cupboard item:", error);
      setError("Failed to remove item from cupboard.");
    }
  };

  const updateCupboardItem = (id: string, updates: Partial<CupboardItem>) => {
    try {
      setCupboardItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
        )
      );
    } catch (error) {
      console.error("[GroceriesContext] Error updating cupboard item:", error);
      setError("Failed to update cupboard item.");
    }
  };

  const moveCheckedItemsToCupboard = () => {
    try {
      const checkedItems = shoppingList.filter((item) => item.checked);
      const uncheckedItems = shoppingList.filter((item) => !item.checked);

      // Convert checked shopping items to cupboard items
      const newCupboardItems: CupboardItem[] = checkedItems.map((item) => {
        const now = new Date();
        return {
          id: `cupboard-${now.getTime()}-${Math.random()}`,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          createdAt: now,
          updatedAt: now,
          // Add expiration date if desired (could be set to null or calculated)
          expirationDate: undefined,
        };
      });

      // Update both lists
      setShoppingList(uncheckedItems);
      setCupboardItems((prev) => [...prev, ...newCupboardItems]);

      console.log(
        `[GroceriesContext] Moved ${checkedItems.length} items to cupboard`
      );
    } catch (error) {
      console.error(
        "[GroceriesContext] Error moving checked items to cupboard:",
        error
      );
      setError("Failed to move checked items to cupboard.");
    }
  };

  const addSelectedRecipe = (recipe: Recipe) => {
    try {
      setSelectedRecipes((prev) => [...prev, recipe]);
    } catch (error) {
      console.error("[GroceriesContext] Error adding selected recipe:", error);
      setError("Failed to add selected recipe.");
    }
  };

  const removeSelectedRecipe = (recipeId: string) => {
    try {
      setSelectedRecipes((prev) =>
        prev.filter((recipe) => recipe.id !== recipeId)
      );
    } catch (error) {
      console.error(
        "[GroceriesContext] Error removing selected recipe:",
        error
      );
      setError("Failed to remove selected recipe.");
    }
  };

  // New simplified methods
  const addItemToShoppingList = async (item: Partial<SupabaseShoppingItem>) => {
    if (!user?.id || !defaultShoppingList) return;

    try {
      const newItem = await addSupabaseShoppingItem(
        defaultShoppingList.id,
        item
      );
      // Convert SupabaseShoppingItem to local ShoppingItem format
      const localItem: ShoppingItem = {
        id: newItem.id,
        name: newItem.name,
        quantity: newItem.quantity ? parseFloat(newItem.quantity) : undefined,
        unit: newItem.unit,
        category: newItem.category,
        checked: newItem.checked,
        recipeId: newItem.recipe_id,
        createdAt: new Date(newItem.created_at),
        updatedAt: new Date(newItem.updated_at),
      };
      setShoppingList((prev) => [...prev, localItem]);
    } catch (error) {
      console.error(
        "[GroceriesContext] Error adding item to shopping list:",
        error
      );
      setError("Failed to add item to shopping list.");
      throw error;
    }
  };

  const updateShoppingItemInList = async (
    itemId: string,
    updates: Partial<SupabaseShoppingItem>
  ) => {
    if (!user?.id) return;

    try {
      const updatedItem = await updateShoppingItem(itemId, updates);
      // Convert SupabaseShoppingItem to local ShoppingItem format
      const localItem: ShoppingItem = {
        id: updatedItem.id,
        name: updatedItem.name,
        quantity: updatedItem.quantity
          ? parseFloat(updatedItem.quantity)
          : undefined,
        unit: updatedItem.unit,
        category: updatedItem.category,
        checked: updatedItem.checked,
        recipeId: updatedItem.recipe_id,
        createdAt: new Date(updatedItem.created_at),
        updatedAt: new Date(updatedItem.updated_at),
      };
      setShoppingList((prev) =>
        prev.map((item) => (item.id === itemId ? localItem : item))
      );
    } catch (error) {
      console.error("[GroceriesContext] Error updating shopping item:", error);
      setError("Failed to update shopping item.");
      throw error;
    }
  };

  const toggleItemInShoppingList = async (itemId: string) => {
    if (!user?.id) return;

    try {
      const currentItem = shoppingList.find((item) => item.id === itemId);
      if (!currentItem) return;

      const updatedItem = await updateShoppingItem(itemId, {
        checked: !currentItem.checked,
      });

      // Convert SupabaseShoppingItem to local ShoppingItem format
      const localItem: ShoppingItem = {
        id: updatedItem.id,
        name: updatedItem.name,
        quantity: updatedItem.quantity
          ? parseFloat(updatedItem.quantity)
          : undefined,
        unit: updatedItem.unit,
        category: updatedItem.category,
        checked: updatedItem.checked,
        recipeId: updatedItem.recipe_id,
        createdAt: new Date(updatedItem.created_at),
        updatedAt: new Date(updatedItem.updated_at),
      };
      setShoppingList((prev) =>
        prev.map((item) => (item.id === itemId ? localItem : item))
      );
    } catch (error) {
      console.error("[GroceriesContext] Error toggling item:", error);
      setError("Failed to update item.");
      throw error;
    }
  };

  const removeItemFromShoppingList = async (itemId: string) => {
    if (!user?.id) return;

    try {
      await removeSupabaseShoppingItem(itemId);
      setShoppingList((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("[GroceriesContext] Error removing item:", error);
      setError("Failed to remove item.");
      throw error;
    }
  };

  const addRecipeToShoppingList = async (recipe: Recipe) => {
    if (!user?.id || !defaultShoppingList) return;

    try {
      // Add all ingredients from the recipe
      for (const ingredient of recipe.ingredients) {
        await addSupabaseShoppingItem(defaultShoppingList.id, {
          name: ingredient.name,
          quantity: ingredient.amount?.toString() || "1",
          unit: ingredient.unit,
          category: "Other",
          recipe_id: recipe.id,
        });
      }

      // Refresh the shopping list to get all new items
      await refreshShoppingList();
    } catch (error) {
      console.error(
        "[GroceriesContext] Error adding recipe to shopping list:",
        error
      );
      setError("Failed to add recipe to shopping list.");
      throw error;
    }
  };

  const removeRecipeFromShoppingList = async (recipeId: string) => {
    if (!user?.id) return;

    try {
      // Remove all items with this recipe_id
      const itemsToRemove = shoppingList.filter(
        (item) => item.recipeId === recipeId
      );
      for (const item of itemsToRemove) {
        await removeSupabaseShoppingItem(item.id);
      }
      setShoppingList((prev) =>
        prev.filter((item) => item.recipeId !== recipeId)
      );
    } catch (error) {
      console.error("[GroceriesContext] Error removing recipe:", error);
      setError("Failed to remove recipe.");
      throw error;
    }
  };

  const refreshShoppingList = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const lists = await getShoppingLists(user.id);

      // Get or create default shopping list
      let defaultList = lists.find((l) => l.title === "My Shopping List");
      if (!defaultList) {
        defaultList = await createShoppingList(user.id, {
          title: "My Shopping List",
          date: new Date().toISOString().split("T")[0],
        });
      }

      setDefaultShoppingList(defaultList);

      // Convert SupabaseShoppingItems to local ShoppingItems
      const localItems: ShoppingItem[] = (defaultList.items || []).map(
        (item) => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity ? parseFloat(item.quantity) : undefined,
          unit: item.unit,
          category: item.category,
          checked: item.checked,
          recipeId: item.recipe_id,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
        })
      );

      setShoppingList(localItems);
    } catch (error) {
      console.error(
        "[GroceriesContext] Error refreshing shopping list:",
        error
      );
      setError("Failed to refresh shopping list.");
    } finally {
      setIsLoading(false);
    }
  };

  // Load Supabase shopping lists when user changes
  useEffect(() => {
    if (user?.id) {
      refreshShoppingList();
    }
  }, [user?.id]);

  const loadRecipesWithIngredients = async () => {
    if (!user?.id) return;

    try {
      const recipes = await getUserRecipesWithIngredients(user.id);
      setRecipesWithIngredients(recipes);
    } catch (error) {
      console.error(
        "[GroceriesContext] Error loading recipes with ingredients:",
        error
      );
      setError("Failed to load recipes with ingredients.");
    }
  };

  return (
    <GroceriesContext.Provider
      value={{
        shoppingList,
        cupboardItems,
        selectedRecipes,
        activeView,
        isLoading,
        error,
        setActiveView,
        addShoppingItem,
        removeShoppingItem,
        toggleShoppingItem,
        addCupboardItem,
        removeCupboardItem,
        updateCupboardItem,
        moveCheckedItemsToCupboard,
        addSelectedRecipe,
        removeSelectedRecipe,
        clearError,
        defaultShoppingList,
        addItemToShoppingList,
        updateShoppingItemInList,
        toggleItemInShoppingList,
        removeItemFromShoppingList,
        addRecipeToShoppingList,
        removeRecipeFromShoppingList,
        refreshShoppingList,
        recipesWithIngredients,
        loadRecipesWithIngredients,
      }}
    >
      {children}
    </GroceriesContext.Provider>
  );
};

export const useGroceries = () => {
  const context = useContext(GroceriesContext);
  if (context === undefined) {
    throw new Error("useGroceries must be used within a GroceriesProvider");
  }
  return context;
};
