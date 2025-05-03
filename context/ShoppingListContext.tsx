import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

interface ShoppingItem {
  id: string;
  shopping_list_id: string;
  name: string;
  quantity: string;
  unit: string;
  category: string;
  checked: boolean;
  emoji?: string;
  cost?: number;
  created_at: string;
  updated_at: string;
}

interface ShoppingList {
  id: string;
  user_id: string;
  title: string;
  date: string;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

interface ShoppingListContextType {
  currentList: ShoppingList | null;
  items: ShoppingItem[];
  loading: boolean;
  error: string | null;
  createList: (title: string) => Promise<void>;
  addItem: (
    item: Omit<
      ShoppingItem,
      "id" | "shopping_list_id" | "created_at" | "updated_at"
    >
  ) => Promise<void>;
  updateItem: (id: string, updates: Partial<ShoppingItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  toggleItemCheck: (id: string) => Promise<void>;
}

export const ShoppingListContext = createContext<
  ShoppingListContextType | undefined
>(undefined);

export function ShoppingListProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCurrentList();
    }
  }, [user]);

  async function fetchCurrentList() {
    try {
      // Get the most recent shopping list or create a new one
      const { data: lists, error: listError } = await supabase
        .from("shopping_lists")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (listError) throw listError;

      let currentList = lists?.[0];

      if (!currentList) {
        const { data: newList, error: createError } = await supabase
          .from("shopping_lists")
          .insert([
            {
              user_id: user?.id,
              title: "Shopping List",
              date: new Date().toISOString().split("T")[0],
              total_cost: 0,
            },
          ])
          .select()
          .single();

        if (createError) throw createError;
        currentList = newList;
      }

      setCurrentList(currentList);
      await fetchItems(currentList.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function fetchItems(listId: string) {
    try {
      const { data, error } = await supabase
        .from("shopping_items")
        .select("*")
        .eq("shopping_list_id", listId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  async function createList(title: string) {
    try {
      const { data, error } = await supabase
        .from("shopping_lists")
        .insert([
          {
            user_id: user?.id,
            title,
            date: new Date().toISOString().split("T")[0],
            total_cost: 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setCurrentList(data);
      setItems([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  async function addItem(
    item: Omit<
      ShoppingItem,
      "id" | "shopping_list_id" | "created_at" | "updated_at"
    >
  ) {
    if (!currentList) return;

    try {
      const { data, error } = await supabase
        .from("shopping_items")
        .insert([
          {
            ...item,
            shopping_list_id: currentList.id,
            checked: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setItems([...items, data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  async function updateItem(id: string, updates: Partial<ShoppingItem>) {
    try {
      const { data, error } = await supabase
        .from("shopping_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setItems(
        items.map((item) => (item.id === id ? { ...item, ...data } : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  async function deleteItem(id: string) {
    try {
      const { error } = await supabase
        .from("shopping_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setItems(items.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  async function toggleItemCheck(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    await updateItem(id, { checked: !item.checked });
  }

  return (
    <ShoppingListContext.Provider
      value={{
        currentList,
        items,
        loading,
        error,
        createList,
        addItem,
        updateItem,
        deleteItem,
        toggleItemCheck,
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

export default ShoppingListProvider;
