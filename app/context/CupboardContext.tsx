import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CupboardItem, CupboardContextType } from "../types";

const CupboardContext = createContext<CupboardContextType | undefined>(
  undefined
);

export function CupboardProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CupboardItem[]>([]);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const storedItems = await AsyncStorage.getItem("cupboardItems");
      if (storedItems) {
        setItems(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error("Error loading cupboard items:", error);
    }
  };

  const addItem = async (item: CupboardItem) => {
    try {
      const newItems = [...items, item];
      setItems(newItems);
      await AsyncStorage.setItem("cupboardItems", JSON.stringify(newItems));
    } catch (error) {
      console.error("Error adding cupboard item:", error);
    }
  };

  const removeItem = async (id: string) => {
    try {
      const newItems = items.filter((item) => item.id !== id);
      setItems(newItems);
      await AsyncStorage.setItem("cupboardItems", JSON.stringify(newItems));
    } catch (error) {
      console.error("Error removing cupboard item:", error);
    }
  };

  const updateItem = async (id: string, updatedItem: Partial<CupboardItem>) => {
    try {
      const newItems = items.map((item) =>
        item.id === id ? { ...item, ...updatedItem } : item
      );
      setItems(newItems);
      await AsyncStorage.setItem("cupboardItems", JSON.stringify(newItems));
    } catch (error) {
      console.error("Error updating cupboard item:", error);
    }
  };

  return (
    <CupboardContext.Provider
      value={{ items, addItem, removeItem, updateItem }}
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
