import React, { createContext, useContext, useState, useEffect } from "react";
import { ShoppingList, ShoppingItem, ShoppingListContextType } from "../types";
import { useAuth } from "./AuthContext";
import * as shoppingListService from "@/services/shoppingListService";
import NetInfo from "@react-native-community/netinfo";

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(
  undefined
);

export function ShoppingListProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [currentListItems, setCurrentListItems] = useState<ShoppingItem[]>([]);
  const [currentListId, setCurrentListId] = useState<string | undefined>(
    undefined
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isNetworkConnected, setIsNetworkConnected] = useState<boolean>(true);
  const { user } = useAuth();

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsNetworkConnected(state.isConnected ?? true);

      // Re-fetch data when connection is restored
      if (state.isConnected && user) {
        fetchShoppingLists();
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch shopping lists when user changes or network reconnects
  useEffect(() => {
    if (user && isNetworkConnected) {
      fetchShoppingLists();
    }
  }, [user, isNetworkConnected]);

  // Fetch items for the current list when it changes
  useEffect(() => {
    if (currentListId && isNetworkConnected) {
      fetchShoppingItems(currentListId);
    } else {
      setCurrentListItems([]);
    }
  }, [currentListId, isNetworkConnected]);

  const fetchShoppingLists = async () => {
    if (!user || !isNetworkConnected) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await shoppingListService.getShoppingLists(
        user.id
      );

      if (error) {
        throw error;
      }

      setShoppingLists(data || []);

      // Set first list as current if we have lists and no current list
      if (data && data.length > 0 && !currentListId) {
        setCurrentListId(data[0].id);
      }
    } catch (err: any) {
      console.error("Error fetching shopping lists:", err);
      setError(
        "Failed to load shopping lists. Please check your connection and try again."
      );

      // Check if it's a network error
      if (err.message && err.message.includes("Network request failed")) {
        setIsNetworkConnected(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchShoppingItems = async (listId: string) => {
    if (!isNetworkConnected) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await shoppingListService.getShoppingItems(
        listId
      );

      if (error) {
        throw error;
      }

      setCurrentListItems(data || []);
    } catch (err: any) {
      console.error("Error fetching shopping items:", err);
      setError(
        "Failed to load shopping items. Please check your connection and try again."
      );

      // Check if it's a network error
      if (err.message && err.message.includes("Network request failed")) {
        setIsNetworkConnected(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const createList = async (name: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await shoppingListService.createShoppingList(
        user.id,
        name
      );

      if (error) {
        throw error;
      }

      // Update local state
      if (data) {
        setShoppingLists((prev) => [data, ...prev]);
        // Set as current list if it's the first one
        if (!currentListId) {
          setCurrentListId(data.id);
        }
      }
    } catch (err) {
      console.error("Error creating shopping list:", err);
      setError("Failed to create shopping list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateList = async (listId: string, name: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await shoppingListService.updateShoppingList(
        listId,
        { name }
      );

      if (error) {
        throw error;
      }

      // Update local state
      if (data) {
        setShoppingLists((prev) =>
          prev.map((list) => (list.id === listId ? { ...list, ...data } : list))
        );
      }
    } catch (err) {
      console.error("Error updating shopping list:", err);
      setError("Failed to update shopping list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteList = async (listId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await shoppingListService.deleteShoppingList(listId);

      if (error) {
        throw error;
      }

      // Update local state
      setShoppingLists((prev) => prev.filter((list) => list.id !== listId));

      // If we deleted the current list, set the first available list as current
      if (currentListId === listId) {
        const remainingLists = shoppingLists.filter(
          (list) => list.id !== listId
        );
        setCurrentListId(
          remainingLists.length > 0 ? remainingLists[0].id : undefined
        );
      }
    } catch (err) {
      console.error("Error deleting shopping list:", err);
      setError("Failed to delete shopping list. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addItemToList = async (listId: string, item: Partial<ShoppingItem>) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await shoppingListService.addShoppingItem(
        listId,
        {
          name: item.name || "",
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          recipe_id: item.recipe_id,
        }
      );

      if (error) {
        throw error;
      }

      // Update local state if this is for the current list
      if (data && listId === currentListId) {
        setCurrentListItems((prev) => [...prev, data]);
      }
    } catch (err) {
      console.error("Error adding shopping item:", err);
      setError("Failed to add shopping item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (itemId: string, updates: Partial<ShoppingItem>) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await shoppingListService.updateShoppingItem(
        itemId,
        updates
      );

      if (error) {
        throw error;
      }

      // Update local state
      if (data) {
        setCurrentListItems((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, ...data } : item))
        );
      }
    } catch (err) {
      console.error("Error updating shopping item:", err);
      setError("Failed to update shopping item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await shoppingListService.deleteShoppingItem(itemId);

      if (error) {
        throw error;
      }

      // Update local state
      setCurrentListItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err) {
      console.error("Error deleting shopping item:", err);
      setError("Failed to delete shopping item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearCheckedItems = async (listId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await shoppingListService.clearCheckedItems(listId);

      if (error) {
        throw error;
      }

      // Update local state if this is the current list
      if (listId === currentListId) {
        setCurrentListItems((prev) => prev.filter((item) => !item.checked));
      }
    } catch (err) {
      console.error("Error clearing checked items:", err);
      setError("Failed to clear checked items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ShoppingListContext.Provider
      value={{
        shoppingLists,
        currentListItems,
        currentListId,
        loading,
        error,
        fetchShoppingLists,
        fetchShoppingItems,
        createList,
        updateList,
        deleteList,
        addItemToList,
        updateItem,
        deleteItem,
        clearCheckedItems,
        setCurrentListId,
      }}
    >
      {children}
    </ShoppingListContext.Provider>
  );
}

export function useShoppingList() {
  const context = useContext(ShoppingListContext);
  if (context === undefined) {
    throw new Error(
      "useShoppingList must be used within a ShoppingListProvider"
    );
  }
  return context;
}
