import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

interface CupboardItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  category: string;
  expiration_date?: string;
  added_date: string;
}

interface CupboardContextType {
  items: CupboardItem[];
  addItem: (item: Omit<CupboardItem, "id" | "added_date">) => Promise<void>;
  updateItem: (id: string, updates: Partial<CupboardItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export const CupboardContext = createContext<CupboardContextType | undefined>(
  undefined
);

export function CupboardProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CupboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  async function fetchItems() {
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("user_id", user?.id)
        .order("expiration_date", { ascending: true, nullsLast: true });

      if (error) throw error;

      setItems(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function addItem(item: Omit<CupboardItem, "id" | "added_date">) {
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .insert([{ ...item, user_id: user?.id }])
        .select()
        .single();

      if (error) throw error;

      setItems([...items, data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  async function updateItem(id: string, updates: Partial<CupboardItem>) {
    try {
      const { data, error } = await supabase
        .from("inventory_items")
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
        .from("inventory_items")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setItems(items.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <CupboardContext.Provider
      value={{
        items,
        addItem,
        updateItem,
        deleteItem,
        loading,
        error,
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

export default CupboardProvider;
