import { supabase } from "@/lib/supabase";
import { PostgrestError } from "@supabase/supabase-js";

/**
 * Creates a new shopping list
 */
export const createShoppingList = async (
  userId: string,
  name: string
): Promise<{ data: any; error: PostgrestError | null }> => {
  return await supabase
    .from("shopping_lists")
    .insert({ user_id: userId, name })
    .select()
    .single();
};

/**
 * Gets all shopping lists for a user
 */
export const getShoppingLists = async (userId: string) => {
  return await supabase
    .from("shopping_lists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
};

/**
 * Updates a shopping list
 */
export const updateShoppingList = async (
  listId: string,
  updates: { name?: string }
) => {
  return await supabase
    .from("shopping_lists")
    .update(updates)
    .eq("id", listId)
    .select()
    .single();
};

/**
 * Deletes a shopping list
 */
export const deleteShoppingList = async (listId: string) => {
  return await supabase.from("shopping_lists").delete().eq("id", listId);
};

/**
 * Adds an item to a shopping list
 */
export const addShoppingItem = async (
  listId: string,
  itemDetails: {
    name: string;
    quantity?: string;
    unit?: string;
    category?: string;
    recipe_id?: string;
  }
) => {
  return await supabase
    .from("shopping_items")
    .insert({ shopping_list_id: listId, ...itemDetails })
    .select()
    .single();
};

/**
 * Gets all items in a shopping list
 */
export const getShoppingItems = async (listId: string) => {
  return await supabase
    .from("shopping_items")
    .select("*")
    .eq("shopping_list_id", listId)
    .order("created_at", { ascending: true });
};

/**
 * Updates a shopping item
 */
export const updateShoppingItem = async (
  itemId: string,
  updates: {
    name?: string;
    quantity?: string;
    unit?: string;
    category?: string;
    checked?: boolean;
  }
) => {
  return await supabase
    .from("shopping_items")
    .update(updates)
    .eq("id", itemId)
    .select()
    .single();
};

/**
 * Deletes a shopping item
 */
export const deleteShoppingItem = async (itemId: string) => {
  return await supabase.from("shopping_items").delete().eq("id", itemId);
};

/**
 * Clears all checked items from a shopping list
 */
export const clearCheckedItems = async (listId: string) => {
  return await supabase
    .from("shopping_items")
    .delete()
    .eq("shopping_list_id", listId)
    .eq("checked", true);
};
