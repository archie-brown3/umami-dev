import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Recipe } from "../types";

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
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [cupboardItems, setCupboardItems] = useState<CupboardItem[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Recipe[]>([]);
  const [activeView, setActiveView] = useState<"shopping" | "cupboard">(
    "shopping"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
