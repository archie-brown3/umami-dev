import { supabase } from "@/lib/supabase";
import { PostgrestError } from "@supabase/supabase-js";

/**
 * Adds a new item to the user's inventory/cupboard
 */
export const addInventoryItem = async (
  userId: string,
  itemDetails: {
    name: string;
    quantity?: string;
    unit?: string;
    category?: string;
    expiration_date?: string;
  }
): Promise<{ data: any; error: PostgrestError | null }> => {
  return await supabase
    .from("inventory_items")
    .insert({ user_id: userId, ...itemDetails })
    .select()
    .single();
};

/**
 * Gets all inventory items for a user
 */
export const getInventoryItems = async (userId: string) => {
  return await supabase
    .from("inventory_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
};

/**
 * Updates an inventory item
 */
export const updateInventoryItem = async (
  itemId: string,
  updates: {
    name?: string;
    quantity?: string;
    unit?: string;
    category?: string;
    expiration_date?: string;
  }
) => {
  return await supabase
    .from("inventory_items")
    .update(updates)
    .eq("id", itemId)
    .select()
    .single();
};

/**
 * Deletes an inventory item
 */
export const deleteInventoryItem = async (itemId: string) => {
  return await supabase.from("inventory_items").delete().eq("id", itemId);
};

/**
 * Gets inventory items that are expiring soon
 */
export const getExpiringItems = async (
  userId: string,
  daysUntilExpiration: number = 7
) => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysUntilExpiration);

  return await supabase
    .from("inventory_items")
    .select("*")
    .eq("user_id", userId)
    .lt("expiration_date", futureDate.toISOString().split("T")[0])
    .gt("expiration_date", new Date().toISOString().split("T")[0])
    .order("expiration_date", { ascending: true });
};

/**
 * Gets inventory items by category
 */
export const getInventoryItemsByCategory = async (
  userId: string,
  category: string
) => {
  return await supabase
    .from("inventory_items")
    .select("*")
    .eq("user_id", userId)
    .eq("category", category)
    .order("name", { ascending: true });
};
