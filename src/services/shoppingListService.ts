import { supabase } from "@/lib/supabase";
import { PostgrestError, PostgrestSingleResponse } from "@supabase/supabase-js";

// Define types for our responses
type SupabaseListResponse<T> = {
  data: T[] | null;
  error: PostgrestError | null;
};
type SupabaseSingleResponse<T> = {
  data: T | null;
  error: PostgrestError | null;
};

/**
 * Utility function to retry a request on failure
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // On subsequent attempts, add increasing delay
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Exponential backoff
        delay *= 2;
      }

      return await operation();
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error);
      lastError = error;

      // If it's not a network error, don't retry
      if (
        !(error instanceof Error) ||
        !error.message.includes("Network request failed")
      ) {
        throw error;
      }
    }
  }

  throw lastError;
}

/**
 * Creates a new shopping list
 */
export const createShoppingList = async (
  userId: string,
  name: string
): Promise<SupabaseSingleResponse<any>> => {
  return await withRetry(async () => {
    return await supabase
      .from("shopping_lists")
      .insert({ user_id: userId, name })
      .select()
      .single();
  });
};

/**
 * Gets all shopping lists for a user
 */
export const getShoppingLists = async (
  userId: string
): Promise<SupabaseListResponse<any>> => {
  return await withRetry(async () => {
    return await supabase
      .from("shopping_lists")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  });
};

/**
 * Updates a shopping list
 */
export const updateShoppingList = async (
  listId: string,
  updates: { name?: string }
): Promise<SupabaseSingleResponse<any>> => {
  return await withRetry(async () => {
    return await supabase
      .from("shopping_lists")
      .update(updates)
      .eq("id", listId)
      .select()
      .single();
  });
};

/**
 * Deletes a shopping list
 */
export const deleteShoppingList = async (
  listId: string
): Promise<{ error: PostgrestError | null }> => {
  return await withRetry(async () => {
    return await supabase.from("shopping_lists").delete().eq("id", listId);
  });
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
): Promise<SupabaseSingleResponse<any>> => {
  return await withRetry(async () => {
    return await supabase
      .from("shopping_items")
      .insert({ shopping_list_id: listId, ...itemDetails })
      .select()
      .single();
  });
};

/**
 * Gets all items in a shopping list
 */
export const getShoppingItems = async (
  listId: string
): Promise<SupabaseListResponse<any>> => {
  return await withRetry(async () => {
    return await supabase
      .from("shopping_items")
      .select("*")
      .eq("shopping_list_id", listId)
      .order("created_at", { ascending: true });
  });
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
): Promise<SupabaseSingleResponse<any>> => {
  return await withRetry(async () => {
    return await supabase
      .from("shopping_items")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single();
  });
};

/**
 * Deletes a shopping item
 */
export const deleteShoppingItem = async (
  itemId: string
): Promise<{ error: PostgrestError | null }> => {
  return await withRetry(async () => {
    return await supabase.from("shopping_items").delete().eq("id", itemId);
  });
};

/**
 * Clears all checked items from a shopping list
 */
export const clearCheckedItems = async (
  listId: string
): Promise<{ error: PostgrestError | null }> => {
  return await withRetry(async () => {
    return await supabase
      .from("shopping_items")
      .delete()
      .eq("shopping_list_id", listId)
      .eq("checked", true);
  });
};
