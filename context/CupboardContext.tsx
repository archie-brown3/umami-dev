import React, { createContext, useContext, useState, useEffect } from "react";
import { InventoryItem, InventoryContextType } from "../types";
import { useAuth } from "./AuthContext";
import * as inventoryService from "@/services/inventoryService";
import NetInfo from "@react-native-community/netinfo";

const CupboardContext = createContext<InventoryContextType | undefined>(
  undefined
);

export function CupboardProvider({ children }: { children: React.ReactNode }) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
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
        fetchInventoryItems();
      }
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch items when user changes or network reconnects
  useEffect(() => {
    if (user && isNetworkConnected) {
      fetchInventoryItems();
    }
  }, [user, isNetworkConnected]);

  const fetchInventoryItems = async () => {
    if (!user || !isNetworkConnected) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await inventoryService.getInventoryItems(user.id);

      if (error) {
        throw error;
      }

      setInventoryItems(data || []);
    } catch (err: any) {
      console.error("Error fetching inventory items:", err);
      setError(
        "Failed to load inventory items. Please check your connection and try again."
      );

      // Check if it's a network error
      if (err.message && err.message.includes("Network request failed")) {
        setIsNetworkConnected(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (item: Partial<InventoryItem>) => {
    if (!user || !isNetworkConnected) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await inventoryService.addInventoryItem(user.id, {
        name: item.name || "",
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        expiration_date: item.expiration_date,
      });

      if (error) {
        throw error;
      }

      // Update local state optimistically
      if (data) {
        setInventoryItems((prev) => [...prev, data]);
      }
    } catch (err: any) {
      console.error("Error adding inventory item:", err);
      setError(
        "Failed to add item. Please check your connection and try again."
      );

      // Check if it's a network error
      if (err.message && err.message.includes("Network request failed")) {
        setIsNetworkConnected(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (
    itemId: string,
    updates: Partial<InventoryItem>
  ) => {
    if (!isNetworkConnected) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await inventoryService.updateInventoryItem(
        itemId,
        updates
      );

      if (error) {
        throw error;
      }

      // Update local state
      if (data) {
        setInventoryItems((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, ...data } : item))
        );
      }
    } catch (err: any) {
      console.error("Error updating inventory item:", err);
      setError(
        "Failed to update item. Please check your connection and try again."
      );

      // Check if it's a network error
      if (err.message && err.message.includes("Network request failed")) {
        setIsNetworkConnected(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!isNetworkConnected) return;

    setLoading(true);
    setError(null);

    try {
      const { error } = await inventoryService.deleteInventoryItem(itemId);

      if (error) {
        throw error;
      }

      // Update local state
      setInventoryItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch (err: any) {
      console.error("Error deleting inventory item:", err);
      setError(
        "Failed to delete item. Please check your connection and try again."
      );

      // Check if it's a network error
      if (err.message && err.message.includes("Network request failed")) {
        setIsNetworkConnected(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const getExpiringItems = async (
    daysUntilExpiration = 7
  ): Promise<InventoryItem[]> => {
    if (!user || !isNetworkConnected) return [];

    try {
      const { data, error } = await inventoryService.getExpiringItems(
        user.id,
        daysUntilExpiration
      );

      if (error) {
        throw error;
      }

      return data || [];
    } catch (err: any) {
      console.error("Error fetching expiring items:", err);

      // Check if it's a network error
      if (err.message && err.message.includes("Network request failed")) {
        setIsNetworkConnected(false);
      }

      return [];
    }
  };

  return (
    <CupboardContext.Provider
      value={{
        inventoryItems,
        loading,
        error,
        fetchInventoryItems,
        addItem,
        updateItem,
        deleteItem,
        getExpiringItems,
      }}
    >
      {children}
    </CupboardContext.Provider>
  );
}

export function useCupboard() {
  const context = useContext(CupboardContext);
  if (context === undefined) {
    throw new Error("useCupboard must be used within a CupboardProvider");
  }
  return context;
}
