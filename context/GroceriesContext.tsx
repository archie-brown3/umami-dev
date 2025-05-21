import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  clearError: () => void;
}

const STORAGE_KEYS = {
  SHOPPING_LIST: "groceries.shoppingList",
  CUPBOARD_ITEMS: "groceries.cupboardItems",
};

const GroceriesContext = createContext<GroceriesContextType | undefined>(
  undefined
);

export const GroceriesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [cupboardItems, setCupboardItems] = useState<CupboardItem[]>([]);
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
        const [shoppingData, cupboardData] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SHOPPING_LIST),
          AsyncStorage.getItem(STORAGE_KEYS.CUPBOARD_ITEMS),
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

  return (
    <GroceriesContext.Provider
      value={{
        shoppingList,
        cupboardItems,
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
