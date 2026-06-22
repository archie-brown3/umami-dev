import React, { createContext, useContext, useState, useEffect } from "react";
import { Recipe, ShoppingList, ShoppingItem as AppShoppingItem } from "../types";
import { demoStore } from "@/lib/demoStore";
import { addNetworkListener } from "@/utils/networkUtils";

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
  shoppingList: ShoppingItem[];
  cupboardItems: CupboardItem[];
  selectedRecipes: Recipe[];
  activeView: "shopping" | "cupboard";
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;

  defaultShoppingList: { id: string; title: string; user_id: string; items: AppShoppingItem[] } | null;
  recipesWithIngredients: Recipe[];
  loadRecipesWithIngredients: () => Promise<void>;

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

  addItemToShoppingList: (item: Partial<AppShoppingItem> & { name: string }) => Promise<void>;
  updateShoppingItemInList: (itemId: string, updates: Partial<AppShoppingItem>) => Promise<void>;
  toggleItemInShoppingList: (itemId: string) => Promise<void>;
  removeItemFromShoppingList: (itemId: string) => Promise<void>;
  addRecipeToShoppingList: (recipe: Recipe) => Promise<void>;
  removeRecipeFromShoppingList: (recipeId: string) => Promise<void>;
  refreshShoppingList: () => Promise<void>;
  retryFailedOperations: () => Promise<void>;
}

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
  const [isOnline, setIsOnline] = useState(true);

  const [defaultShoppingList, setDefaultShoppingList] = useState<{
    id: string;
    title: string;
    user_id: string;
    items: AppShoppingItem[];
  } | null>({
    id: "demo-list-1",
    title: "Shopping List",
    user_id: "demo-user-001",
    items: demoStore.getShoppingItems("demo-list-1"),
  });

  const [recipesWithIngredients, setRecipesWithIngredients] = useState<
    Recipe[]
  >([]);

  useEffect(() => {
    const unsubscribe = addNetworkListener((networkState) => {
      setIsOnline(
        networkState.isConnected && networkState.isInternetReachable !== false
      );
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    refreshShoppingList();
    loadRecipesWithIngredients();
  }, []);

  const clearError = () => setError(null);

  const refreshShoppingList = async () => {
    const items = demoStore.getShoppingItems("demo-list-1");
    setDefaultShoppingList({
      id: "demo-list-1",
      title: "Shopping List",
      user_id: "demo-user-001",
      items,
    });
  };

  const addItemToShoppingList = async (item: Partial<AppShoppingItem> & { name: string }) => {
    demoStore.addShoppingItem({
      ...item,
      shopping_list_id: "demo-list-1",
    });
    await refreshShoppingList();
  };

  const updateShoppingItemInList = async (
    itemId: string,
    updates: Partial<AppShoppingItem>
  ) => {
    demoStore.updateShoppingItem(itemId, updates);
    await refreshShoppingList();
  };

  const toggleItemInShoppingList = async (itemId: string) => {
    const items = demoStore.getShoppingItems("demo-list-1");
    const currentItem = items.find((item) => item.id === itemId);
    if (!currentItem) return;
    demoStore.updateShoppingItem(itemId, { checked: !currentItem.checked });
    await refreshShoppingList();
  };

  const removeItemFromShoppingList = async (itemId: string) => {
    demoStore.removeShoppingItem(itemId);
    await refreshShoppingList();
  };

  const retryFailedOperations = async () => {
    await refreshShoppingList();
  };

  const addShoppingItem = (
    item: Omit<ShoppingItem, "id" | "createdAt" | "updatedAt">
  ) => {
    const now = new Date();
    const newItem: ShoppingItem = {
      ...item,
      id: now.getTime().toString(),
      createdAt: now,
      updatedAt: now,
    };
    setShoppingList((prev) => [...prev, newItem]);
  };

  const removeShoppingItem = (id: string) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleShoppingItem = (id: string) => {
    setShoppingList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, checked: !item.checked, updatedAt: new Date() }
          : item
      )
    );
  };

  const addCupboardItem = (
    item: Omit<CupboardItem, "id" | "createdAt" | "updatedAt">
  ) => {
    const now = new Date();
    const newItem: CupboardItem = {
      ...item,
      id: now.getTime().toString(),
      createdAt: now,
      updatedAt: now,
    };
    setCupboardItems((prev) => [...prev, newItem]);
  };

  const removeCupboardItem = (id: string) => {
    setCupboardItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateCupboardItem = (id: string, updates: Partial<CupboardItem>) => {
    setCupboardItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
      )
    );
  };

  const moveCheckedItemsToCupboard = () => {
      const shoppingListItems = defaultShoppingList?.items || [];
      const checkedItems = shoppingListItems.filter((item: AppShoppingItem) => item.checked);

      const newCupboardItems: CupboardItem[] = checkedItems.map((item: AppShoppingItem) => {
      const now = new Date();
      return {
        id: `cupboard-${now.getTime()}-${Math.random()}`,
        name: item.name,
        quantity: parseFloat(item.quantity || "1") || 1,
        unit: item.unit,
        category: item.category,
        createdAt: now,
        updatedAt: now,
        expirationDate: undefined,
      };
    });

    setCupboardItems((prev) => [...prev, ...newCupboardItems]);

      checkedItems.forEach((item: AppShoppingItem) => {
      demoStore.removeShoppingItem(item.id);
    });

    refreshShoppingList();
  };

  const addSelectedRecipe = (recipe: Recipe) => {
    setSelectedRecipes((prev) => [...prev, recipe]);
  };

  const removeSelectedRecipe = (recipeId: string) => {
    setSelectedRecipes((prev) =>
      prev.filter((recipe) => recipe.id !== recipeId)
    );
  };

  const addRecipeToShoppingList = async (recipe: Recipe) => {
    const addPromises = recipe.ingredients.map((ingredient) =>
      addItemToShoppingList({
        name: ingredient.name,
        quantity: ingredient.amount?.toString() || "1",
        unit: ingredient.unit,
        category: "Pantry Staples",
        recipe_id: recipe.id,
      })
    );
    await Promise.allSettled(addPromises);
    await refreshShoppingList();
  };

  const removeRecipeFromShoppingList = async (recipeId: string) => {
    const items = defaultShoppingList?.items || [];
    const itemsToRemove = items.filter(
      (item: AppShoppingItem) => item.recipe_id === recipeId
    );
    itemsToRemove.forEach((item: AppShoppingItem) => {
      demoStore.removeShoppingItem(item.id);
    });
    await refreshShoppingList();
  };

  const loadRecipesWithIngredients = async () => {
    setRecipesWithIngredients(demoStore.getRecipes());
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
        isOnline,
        defaultShoppingList,
        recipesWithIngredients,
        loadRecipesWithIngredients,
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
        addItemToShoppingList,
        updateShoppingItemInList,
        toggleItemInShoppingList,
        removeItemFromShoppingList,
        addRecipeToShoppingList,
        removeRecipeFromShoppingList,
        refreshShoppingList,
        retryFailedOperations,
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
