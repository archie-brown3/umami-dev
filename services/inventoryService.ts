import { supabase } from "@/lib/supabase";
import { PostgrestError } from "@supabase/supabase-js";

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
): Promise<SupabaseSingleResponse<any>> => {
  return await withRetry(async () => {
    return await supabase
      .from("inventory_items")
      .insert({ user_id: userId, ...itemDetails })
      .select()
      .single();
  });
};

/**
 * Gets all inventory items for a user
 */
export const getInventoryItems = async (
  userId: string
): Promise<SupabaseListResponse<any>> => {
  return await withRetry(async () => {
    return await supabase
      .from("inventory_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  });
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
): Promise<SupabaseSingleResponse<any>> => {
  return await withRetry(async () => {
    return await supabase
      .from("inventory_items")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single();
  });
};

/**
 * Deletes an inventory item
 */
export const deleteInventoryItem = async (
  itemId: string
): Promise<{ error: PostgrestError | null }> => {
  return await withRetry(async () => {
    return await supabase.from("inventory_items").delete().eq("id", itemId);
  });
};

/**
 * Gets inventory items that are expiring soon
 */
export const getExpiringItems = async (
  userId: string,
  daysUntilExpiration: number = 7
): Promise<SupabaseListResponse<any>> => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysUntilExpiration);

  return await withRetry(async () => {
    return await supabase
      .from("inventory_items")
      .select("*")
      .eq("user_id", userId)
      .lt("expiration_date", futureDate.toISOString().split("T")[0])
      .gt("expiration_date", new Date().toISOString().split("T")[0])
      .order("expiration_date", { ascending: true });
  });
};

/**
 * Gets inventory items by category
 */
export const getInventoryItemsByCategory = async (
  userId: string,
  category: string
): Promise<SupabaseListResponse<any>> => {
  return await withRetry(async () => {
    return await supabase
      .from("inventory_items")
      .select("*")
      .eq("user_id", userId)
      .eq("category", category)
      .order("name", { ascending: true });
  });
};
