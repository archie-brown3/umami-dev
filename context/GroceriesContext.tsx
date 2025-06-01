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
  GroceriesServiceError,
} from "@/services/groceriesService";
import { getUserRecipesWithIngredients } from "@/services/recipeService";
import { networkManager, addNetworkListener } from "@/utils/networkUtils";
import { Alert } from "react-native";

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
  isOnline: boolean;

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

  // Enhanced methods with better error handling
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
  retryFailedOperations: () => Promise<void>;
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
  const [isOnline, setIsOnline] = useState(true);

  // Default shopping list (no more multiple lists)
  const [defaultShoppingList, setDefaultShoppingList] =
    useState<ShoppingList | null>(null);

  // Recipes with ingredients for shopping list
  const [recipesWithIngredients, setRecipesWithIngredients] = useState<
    Recipe[]
  >([]);

  // Get auth context - should be safe since AuthProvider wraps this provider
  const { user } = useAuth();

  // Network connectivity monitoring
  useEffect(() => {
    const unsubscribe = addNetworkListener((networkState) => {
      setIsOnline(
        networkState.isConnected && networkState.isInternetReachable !== false
      );

      // Auto-sync when coming back online
      if (networkState.isConnected && networkState.isInternetReachable) {
        console.log(
          "[GroceriesContext] Network restored, syncing offline actions"
        );
        networkManager.syncOfflineActions();
        refreshShoppingList();
      }
    });

    return unsubscribe;
  }, []);

  // Load Supabase shopping lists when user changes
  useEffect(() => {
    if (user?.id) {
      refreshShoppingList();
      loadRecipesWithIngredients();
    }
  }, [user?.id]);

  // Enhanced error handling function
  const handleError = (
    error: any,
    operation: string,
    showAlert: boolean = true
  ) => {
    console.error(`[GroceriesContext] Error in ${operation}:`, error);

    let userMessage = "An unexpected error occurred";

    if (error instanceof GroceriesServiceError) {
      switch (error.code) {
        case "NETWORK_ERROR":
          userMessage =
            "Network connection failed. Your changes will be saved and synced when connection is restored.";
          break;
        case "AUTH_EXPIRED":
          userMessage = "Your session has expired. Please log in again.";
          break;
        case "VALIDATION_ERROR":
          userMessage = error.message;
          break;
        case "NOT_FOUND":
          userMessage = "The requested item was not found.";
          break;
        default:
          userMessage = error.message || "An unexpected error occurred";
      }
    } else if (
      error?.message?.includes("network") ||
      error?.message?.includes("fetch")
    ) {
      userMessage =
        "Network connection failed. Please check your internet connection.";
    }

    setError(userMessage);

    if (showAlert && error.code !== "NETWORK_ERROR") {
      Alert.alert("Error", userMessage, [
        { text: "OK", onPress: () => setError(null) },
        ...(error.code === "AUTH_EXPIRED"
          ? [
              {
                text: "Log In",
                onPress: () => {
                  /* Navigate to login */
                },
              },
            ]
          : []),
      ]);
    }
  };

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
        handleError(error, "loading data", false);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Enhanced save functions with error handling
  const saveShoppingListToStorage = async (data: ShoppingItem[]) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SHOPPING_LIST,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error("[GroceriesContext] Error saving shopping list:", error);
      // Don't show alert for storage errors, just log them
    }
  };

  const saveCupboardToStorage = async (data: CupboardItem[]) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CUPBOARD_ITEMS,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error("[GroceriesContext] Error saving cupboard items:", error);
      // Don't show alert for storage errors, just log them
    }
  };

  // Save shopping list data to AsyncStorage when it changes
  useEffect(() => {
    if (shoppingList.length > 0) {
      saveShoppingListToStorage(shoppingList);
    }
  }, [shoppingList]);

  // Save cupboard data to AsyncStorage when it changes
  useEffect(() => {
    if (cupboardItems.length > 0) {
      saveCupboardToStorage(cupboardItems);
    }
  }, [cupboardItems]);

  // Save selected recipes to AsyncStorage when they change
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
      }
    };

    if (selectedRecipes.length > 0) {
      saveData();
    }
  }, [selectedRecipes]);

  const clearError = () => setError(null);

  // Enhanced shopping list operations with better error handling
  const addItemToShoppingList = async (item: Partial<SupabaseShoppingItem>) => {
    if (!user?.id) {
      handleError(
        new Error("User not authenticated"),
        "adding item to shopping list"
      );
      return;
    }

    setIsLoading(true);
    try {
      // Get or create default shopping list
      let lists = await getShoppingLists(user.id);
      let defaultList = lists.find((list) => list.title === "Shopping List");

      if (!defaultList) {
        defaultList = await createShoppingList(user.id, {
          title: "Shopping List",
          date: new Date().toISOString().split("T")[0],
        });
      }

      await addSupabaseShoppingItem(defaultList.id, item);
      await refreshShoppingList();

      console.log("[GroceriesContext] Item added successfully");
    } catch (error) {
      handleError(error, "adding item to shopping list");

      // Store offline action if network error
      if (
        error instanceof GroceriesServiceError &&
        error.code === "NETWORK_ERROR"
      ) {
        await networkManager.persistOfflineAction({
          type: "ADD_SHOPPING_ITEM",
          payload: { item },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateShoppingItemInList = async (
    itemId: string,
    updates: Partial<SupabaseShoppingItem>
  ) => {
    try {
      // Optimistic update - update item immediately in UI
      if (defaultShoppingList) {
        const updatedItems =
          defaultShoppingList.items?.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          ) || [];

        setDefaultShoppingList({
          ...defaultShoppingList,
          items: updatedItems,
        });
      }

      // Perform the actual update in the background
      await updateShoppingItem(itemId, updates);
      console.log("[GroceriesContext] Item updated successfully");
    } catch (error) {
      // If update fails, refresh to restore the correct state
      console.error(
        "[GroceriesContext] Failed to update item, refreshing list"
      );
      await refreshShoppingList();
      handleError(error, "updating shopping item");

      // Store offline action if network error
      if (
        error instanceof GroceriesServiceError &&
        error.code === "NETWORK_ERROR"
      ) {
        await networkManager.persistOfflineAction({
          type: "UPDATE_SHOPPING_ITEM",
          payload: { itemId, updates },
        });
      }
    }
  };

  const toggleItemInShoppingList = async (itemId: string) => {
    try {
      // Find the item in the current shopping list
      const currentItem = defaultShoppingList?.items?.find(
        (item) => item.id === itemId
      );
      if (!currentItem) {
        throw new Error("Item not found in shopping list");
      }

      await updateShoppingItemInList(itemId, {
        checked: !currentItem.checked,
      });
    } catch (error) {
      handleError(error, "toggling shopping item");
    }
  };

  const removeItemFromShoppingList = async (itemId: string) => {
    try {
      // Optimistic update - remove item immediately from UI
      if (defaultShoppingList) {
        const updatedItems =
          defaultShoppingList.items?.filter((item) => item.id !== itemId) || [];

        setDefaultShoppingList({
          ...defaultShoppingList,
          items: updatedItems,
        });
      }

      // Perform the actual deletion in the background
      await removeSupabaseShoppingItem(itemId);
      console.log("[GroceriesContext] Item removed successfully");
    } catch (error) {
      // If deletion fails, refresh to restore the correct state
      console.error(
        "[GroceriesContext] Failed to remove item, refreshing list"
      );
      await refreshShoppingList();
      handleError(error, "removing item from shopping list");

      // Store offline action if network error
      if (
        error instanceof GroceriesServiceError &&
        error.code === "NETWORK_ERROR"
      ) {
        await networkManager.persistOfflineAction({
          type: "DELETE_SHOPPING_ITEM",
          payload: { itemId },
        });
      }
    }
  };

  const refreshShoppingList = async () => {
    if (!user?.id) return;

    try {
      const lists = await getShoppingLists(user.id);
      const defaultList = lists.find((list) => list.title === "Shopping List");
      setDefaultShoppingList(defaultList || null);

      console.log("[GroceriesContext] Shopping list refreshed");
    } catch (error) {
      handleError(error, "refreshing shopping list", false);
    }
  };

  const retryFailedOperations = async () => {
    setIsLoading(true);
    try {
      await networkManager.syncOfflineActions();
      await refreshShoppingList();

      Alert.alert("Success", "All pending changes have been synchronized.", [
        { text: "OK" },
      ]);
    } catch (error) {
      handleError(error, "retrying failed operations");
    } finally {
      setIsLoading(false);
    }
  };

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
      // Get shopping list items from defaultShoppingList
      const shoppingListItems = defaultShoppingList?.items || [];
      const checkedItems = shoppingListItems.filter((item) => item.checked);
      const uncheckedItems = shoppingListItems.filter((item) => !item.checked);

      // Convert checked shopping items to cupboard items
      const newCupboardItems: CupboardItem[] = checkedItems.map((item) => {
        const now = new Date();
        return {
          id: `cupboard-${now.getTime()}-${Math.random()}`,
          name: item.name,
          quantity: parseFloat(item.quantity) || 1,
          unit: item.unit,
          category: item.category,
          createdAt: now,
          updatedAt: now,
          // Add expiration date if desired (could be set to null or calculated)
          expirationDate: undefined,
        };
      });

      // Update cupboard items
      setCupboardItems((prev) => [...prev, ...newCupboardItems]);

      // Remove checked items from shopping list by calling the API
      checkedItems.forEach(async (item) => {
        try {
          await removeSupabaseShoppingItem(item.id);
        } catch (error) {
          console.error(`Error removing item ${item.id}:`, error);
        }
      });

      // Refresh shopping list to get updated data
      refreshShoppingList();

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

  const addRecipeToShoppingList = async (recipe: Recipe) => {
    if (!user?.id) {
      handleError(
        new Error("User not authenticated"),
        "adding recipe to shopping list"
      );
      return;
    }

    setIsLoading(true);
    try {
      // Get or create default shopping list
      let lists = await getShoppingLists(user.id);
      let defaultList = lists.find((list) => list.title === "Shopping List");

      if (!defaultList) {
        defaultList = await createShoppingList(user.id, {
          title: "Shopping List",
          date: new Date().toISOString().split("T")[0],
        });
      }

      // Add all ingredients from the recipe
      const addPromises = recipe.ingredients.map((ingredient) =>
        addSupabaseShoppingItem(defaultList!.id, {
          name: ingredient.name,
          quantity: ingredient.amount?.toString() || "1",
          unit: ingredient.unit,
          category: "Pantry Staples",
          recipe_id: recipe.id,
        })
      );

      await Promise.allSettled(addPromises);
      await refreshShoppingList();

      console.log(
        "[GroceriesContext] Recipe added to shopping list successfully"
      );
    } catch (error) {
      handleError(error, "adding recipe to shopping list");

      // Store offline action if network error
      if (
        error instanceof GroceriesServiceError &&
        error.code === "NETWORK_ERROR"
      ) {
        await networkManager.persistOfflineAction({
          type: "ADD_RECIPE_TO_SHOPPING_LIST",
          payload: { recipe },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const removeRecipeFromShoppingList = async (recipeId: string) => {
    if (!user?.id || !defaultShoppingList) {
      handleError(
        new Error("User not authenticated or no shopping list"),
        "removing recipe from shopping list"
      );
      return;
    }

    setIsLoading(true);
    try {
      // Remove all items with this recipe_id
      const itemsToRemove =
        defaultShoppingList.items?.filter(
          (item) => item.recipe_id === recipeId
        ) || [];

      const removePromises = itemsToRemove.map((item) =>
        removeSupabaseShoppingItem(item.id)
      );

      await Promise.allSettled(removePromises);
      await refreshShoppingList();

      console.log(
        "[GroceriesContext] Recipe removed from shopping list successfully"
      );
    } catch (error) {
      handleError(error, "removing recipe from shopping list");

      // Store offline action if network error
      if (
        error instanceof GroceriesServiceError &&
        error.code === "NETWORK_ERROR"
      ) {
        await networkManager.persistOfflineAction({
          type: "REMOVE_RECIPE_FROM_SHOPPING_LIST",
          payload: { recipeId },
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecipesWithIngredients = async () => {
    if (!user?.id) return;

    try {
      const recipes = await getUserRecipesWithIngredients(user.id);
      setRecipesWithIngredients(recipes);
      console.log(
        "[GroceriesContext] Recipes with ingredients loaded successfully"
      );
    } catch (error) {
      handleError(error, "loading recipes with ingredients", false);
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
