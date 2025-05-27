import { supabase } from "@/lib/supabase";
import { getMealPlans } from "./mealPlanService";
import { withNetworkRetry, networkManager } from "@/utils/networkUtils";

// Interfaces matching the database schema
export interface ShoppingList {
  id: string;
  user_id: string;
  title: string;
  date: string;
  total_cost?: number;
  total_package_cost?: number;
  price_confidence?: number;
  created_at: string;
  updated_at: string;
  items?: ShoppingItem[];
}

export interface ShoppingItem {
  id: string;
  shopping_list_id: string;
  ingredient_id?: string;
  name: string;
  quantity: string;
  unit?: string;
  category: string;
  recipe_id?: string; // Source recipe if from meal plan
  emoji?: string;
  cost?: number;
  package_price?: number;
  package_cost?: number;
  price_confidence?: number;
  checked: boolean; // Matches database schema
  created_at: string;
  updated_at: string;
}

// Enhanced error types for better error handling
export class GroceriesServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: any
  ) {
    super(message);
    this.name = "GroceriesServiceError";
  }

  static fromSupabaseError(error: any): GroceriesServiceError {
    console.error("[GroceriesService] Supabase error:", error);

    if (error?.code === "PGRST116") {
      return new GroceriesServiceError(
        "The requested item was not found",
        "NOT_FOUND",
        error
      );
    } else if (error?.code === "23505") {
      return new GroceriesServiceError(
        "This item already exists",
        "DUPLICATE_ENTRY",
        error
      );
    } else if (error?.code === "23503") {
      return new GroceriesServiceError(
        "Cannot perform this action due to data constraints",
        "CONSTRAINT_VIOLATION",
        error
      );
    } else if (error?.message?.includes("JWT")) {
      return new GroceriesServiceError(
        "Authentication expired. Please log in again.",
        "AUTH_EXPIRED",
        error
      );
    } else if (error?.message?.includes("network")) {
      return new GroceriesServiceError(
        "Network connection failed. Please check your internet connection.",
        "NETWORK_ERROR",
        error
      );
    } else {
      return new GroceriesServiceError(
        error?.message || "An unexpected error occurred",
        "UNKNOWN_ERROR",
        error
      );
    }
  }
}

// Validation functions
export const validateShoppingList = (list: Partial<ShoppingList>): string[] => {
  const errors: string[] = [];

  if (!list.title || list.title.trim().length === 0) {
    errors.push("Shopping list title is required");
  } else if (list.title.trim().length > 100) {
    errors.push("Shopping list title must be less than 100 characters");
  }

  if (list.date && !isValidDate(list.date)) {
    errors.push("Invalid date format");
  }

  if (
    list.total_cost !== undefined &&
    (list.total_cost < 0 || list.total_cost > 999999)
  ) {
    errors.push("Total cost must be between 0 and 999,999");
  }

  return errors;
};

export const validateShoppingItem = (item: Partial<ShoppingItem>): string[] => {
  const errors: string[] = [];

  if (!item.name || item.name.trim().length === 0) {
    errors.push("Item name is required");
  } else if (item.name.trim().length > 200) {
    errors.push("Item name must be less than 200 characters");
  }

  if (item.quantity && !isValidQuantity(item.quantity)) {
    errors.push("Invalid quantity format");
  }

  if (item.unit && item.unit.length > 50) {
    errors.push("Unit must be less than 50 characters");
  }

  if (item.category && item.category.length > 100) {
    errors.push("Category must be less than 100 characters");
  }

  return errors;
};

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

const isValidQuantity = (quantity: string): boolean => {
  // Allow numbers, fractions, and common quantity formats
  const quantityRegex = /^(\d+(\.\d+)?|\d+\/\d+|\d+\s+\d+\/\d+)$/;
  return quantityRegex.test(quantity.trim());
};

// Core CRUD operations for shopping lists with enhanced error handling
export const createShoppingList = async (
  userId: string,
  list: Partial<ShoppingList>
): Promise<ShoppingList> => {
  // Validate input
  const validationErrors = validateShoppingList(list);
  if (validationErrors.length > 0) {
    throw new GroceriesServiceError(
      `Validation failed: ${validationErrors.join(", ")}`,
      "VALIDATION_ERROR"
    );
  }

  return withNetworkRetry(
    async () => {
      try {
        console.log("[GroceriesService] Creating shopping list:", list.title);

        const { data, error } = await supabase
          .from("shopping_lists")
          .insert({
            user_id: userId,
            title: list.title?.trim() || "New Shopping List",
            date: list.date || new Date().toISOString().split("T")[0],
            total_cost: list.total_cost,
            total_package_cost: list.total_package_cost,
            price_confidence: list.price_confidence,
          })
          .select()
          .single();

        if (error) {
          throw GroceriesServiceError.fromSupabaseError(error);
        }

        console.log(
          "[GroceriesService] Shopping list created successfully:",
          data.id
        );
        return { ...data, items: [] };
      } catch (error) {
        if (error instanceof GroceriesServiceError) {
          throw error;
        }
        throw GroceriesServiceError.fromSupabaseError(error);
      }
    },
    { maxRetries: 2 }
  );
};

export const getShoppingLists = async (
  userId: string
): Promise<ShoppingList[]> => {
  return networkManager.getCachedData(
    `shopping_lists_${userId}`,
    async () => {
      return withNetworkRetry(
        async () => {
          try {
            console.log(
              "[GroceriesService] Fetching shopping lists for user:",
              userId
            );

            const { data, error } = await supabase
              .from("shopping_lists")
              .select(
                `
              *,
              shopping_items (
                id,
                shopping_list_id,
                ingredient_id,
                name,
                quantity,
                unit,
                category,
                recipe_id,
                emoji,
                cost,
                package_price,
                package_cost,
                price_confidence,
                checked,
                created_at,
                updated_at
              )
            `
              )
              .eq("user_id", userId)
              .order("created_at", { ascending: false });

            if (error) {
              throw GroceriesServiceError.fromSupabaseError(error);
            }

            const lists = data.map((list) => ({
              ...list,
              items: list.shopping_items || [],
            }));

            console.log(
              `[GroceriesService] Fetched ${lists.length} shopping lists`
            );
            return lists;
          } catch (error) {
            if (error instanceof GroceriesServiceError) {
              throw error;
            }
            throw GroceriesServiceError.fromSupabaseError(error);
          }
        },
        { maxRetries: 3 }
      );
    },
    { ttl: 2 * 60 * 1000 } // Cache for 2 minutes
  );
};

export const updateShoppingList = async (
  listId: string,
  updates: Partial<ShoppingList>
): Promise<ShoppingList> => {
  // Validate input
  const validationErrors = validateShoppingList(updates);
  if (validationErrors.length > 0) {
    throw new GroceriesServiceError(
      `Validation failed: ${validationErrors.join(", ")}`,
      "VALIDATION_ERROR"
    );
  }

  return withNetworkRetry(
    async () => {
      try {
        console.log("[GroceriesService] Updating shopping list:", listId);

        const { data, error } = await supabase
          .from("shopping_lists")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", listId)
          .select()
          .single();

        if (error) {
          throw GroceriesServiceError.fromSupabaseError(error);
        }

        // Clear cache for this user's shopping lists
        const userId = data.user_id;
        networkManager.clearCache(`shopping_lists_${userId}`);

        console.log("[GroceriesService] Shopping list updated successfully");
        return data;
      } catch (error) {
        if (error instanceof GroceriesServiceError) {
          throw error;
        }
        throw GroceriesServiceError.fromSupabaseError(error);
      }
    },
    { maxRetries: 2 }
  );
};

export const deleteShoppingList = async (listId: string): Promise<void> => {
  return withNetworkRetry(
    async () => {
      try {
        console.log("[GroceriesService] Deleting shopping list:", listId);

        // First get the list to clear cache later
        const { data: listData } = await supabase
          .from("shopping_lists")
          .select("user_id")
          .eq("id", listId)
          .single();

        const { error } = await supabase
          .from("shopping_lists")
          .delete()
          .eq("id", listId);

        if (error) {
          throw GroceriesServiceError.fromSupabaseError(error);
        }

        // Clear cache for this user's shopping lists
        if (listData?.user_id) {
          networkManager.clearCache(`shopping_lists_${listData.user_id}`);
        }

        console.log("[GroceriesService] Shopping list deleted successfully");
      } catch (error) {
        if (error instanceof GroceriesServiceError) {
          throw error;
        }
        throw GroceriesServiceError.fromSupabaseError(error);
      }
    },
    { maxRetries: 2 }
  );
};

// Core CRUD operations for shopping items with enhanced error handling
export const addShoppingItem = async (
  listId: string,
  item: Partial<ShoppingItem>
): Promise<ShoppingItem> => {
  // Validate input
  const validationErrors = validateShoppingItem(item);
  if (validationErrors.length > 0) {
    throw new GroceriesServiceError(
      `Validation failed: ${validationErrors.join(", ")}`,
      "VALIDATION_ERROR"
    );
  }

  return withNetworkRetry(
    async () => {
      try {
        console.log("[GroceriesService] Adding shopping item:", item.name);

        const { data, error } = await supabase
          .from("shopping_items")
          .insert({
            shopping_list_id: listId,
            ingredient_id: item.ingredient_id,
            name: item.name?.trim() || "",
            quantity: item.quantity?.trim() || "1",
            unit: item.unit?.trim(),
            category: item.category?.trim() || "Other",
            recipe_id: item.recipe_id,
            emoji: item.emoji,
            cost: item.cost,
            package_price: item.package_price,
            package_cost: item.package_cost,
            price_confidence: item.price_confidence,
            checked: item.checked || false,
          })
          .select()
          .single();

        if (error) {
          throw GroceriesServiceError.fromSupabaseError(error);
        }

        // Clear relevant caches
        networkManager.clearCache("shopping_lists_");

        console.log(
          "[GroceriesService] Shopping item added successfully:",
          data.id
        );
        return data;
      } catch (error) {
        if (error instanceof GroceriesServiceError) {
          throw error;
        }
        throw GroceriesServiceError.fromSupabaseError(error);
      }
    },
    { maxRetries: 2 }
  );
};

export const updateShoppingItem = async (
  itemId: string,
  updates: Partial<ShoppingItem>
): Promise<ShoppingItem> => {
  // Validate input
  const validationErrors = validateShoppingItem(updates);
  if (validationErrors.length > 0) {
    throw new GroceriesServiceError(
      `Validation failed: ${validationErrors.join(", ")}`,
      "VALIDATION_ERROR"
    );
  }

  return withNetworkRetry(
    async () => {
      try {
        console.log("[GroceriesService] Updating shopping item:", itemId);

        const { data, error } = await supabase
          .from("shopping_items")
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq("id", itemId)
          .select()
          .single();

        if (error) {
          throw GroceriesServiceError.fromSupabaseError(error);
        }

        // Clear relevant caches
        networkManager.clearCache("shopping_lists_");

        console.log("[GroceriesService] Shopping item updated successfully");
        return data;
      } catch (error) {
        if (error instanceof GroceriesServiceError) {
          throw error;
        }
        throw GroceriesServiceError.fromSupabaseError(error);
      }
    },
    { maxRetries: 2 }
  );
};

export const removeShoppingItem = async (itemId: string): Promise<void> => {
  return withNetworkRetry(
    async () => {
      try {
        console.log("[GroceriesService] Removing shopping item:", itemId);

        const { error } = await supabase
          .from("shopping_items")
          .delete()
          .eq("id", itemId);

        if (error) {
          throw GroceriesServiceError.fromSupabaseError(error);
        }

        // Clear relevant caches
        networkManager.clearCache("shopping_lists_");

        console.log("[GroceriesService] Shopping item removed successfully");
      } catch (error) {
        if (error instanceof GroceriesServiceError) {
          throw error;
        }
        throw GroceriesServiceError.fromSupabaseError(error);
      }
    },
    { maxRetries: 2 }
  );
};

// Enhanced meal plan integration with better error handling
export const generateShoppingListFromMealPlan = async (
  userId: string,
  dateRange: { start: string; end: string }
): Promise<ShoppingList> => {
  return withNetworkRetry(
    async () => {
      try {
        console.log(
          "[GroceriesService] Generating shopping list from meal plan"
        );

        // Get meal plans for the date range
        const mealPlans = await getMealPlans(userId, dateRange);

        if (!mealPlans || mealPlans.length === 0) {
          throw new GroceriesServiceError(
            "No meal plans found for the selected date range",
            "NO_MEAL_PLANS"
          );
        }

        // Get or create default shopping list
        const lists = await getShoppingLists(userId);
        let defaultList = lists.find((list) => list.title === "Shopping List");

        if (!defaultList) {
          defaultList = await createShoppingList(userId, {
            title: "Shopping List",
            date: new Date().toISOString().split("T")[0],
          });
        }

        // Extract recipe IDs from meal plans
        const recipeIds = new Set<string>();

        for (const mealPlan of mealPlans) {
          if (mealPlan.items) {
            for (const item of mealPlan.items) {
              recipeIds.add(item.recipe_id);
            }
          }
        }

        if (recipeIds.size === 0) {
          throw new GroceriesServiceError(
            "No recipes found in the selected meal plans",
            "NO_RECIPES"
          );
        }

        // Fetch recipe details from Supabase to get ingredients
        const { data: recipes, error: recipesError } = await supabase
          .from("recipes")
          .select(
            `
          id,
          title,
          recipe_ingredients (
            id,
            name,
            quantity,
            unit,
            category
          )
        `
          )
          .in("id", Array.from(recipeIds));

        if (recipesError) {
          throw GroceriesServiceError.fromSupabaseError(recipesError);
        }

        if (!recipes || recipes.length === 0) {
          throw new GroceriesServiceError(
            "No recipe details found for the meal plan recipes",
            "NO_RECIPE_DETAILS"
          );
        }

        // Extract ingredients from recipes
        const ingredientsToAdd: Partial<ShoppingItem>[] = [];

        for (const recipe of recipes) {
          if (recipe.recipe_ingredients) {
            for (const ingredient of recipe.recipe_ingredients) {
              ingredientsToAdd.push({
                name: ingredient.name,
                quantity: ingredient.quantity || "1",
                unit: ingredient.unit,
                category: ingredient.category || "Other",
                recipe_id: recipe.id,
                ingredient_id: ingredient.id,
              });
            }
          }
        }

        if (ingredientsToAdd.length === 0) {
          throw new GroceriesServiceError(
            "No ingredients found in the selected recipes",
            "NO_INGREDIENTS"
          );
        }

        // Add ingredients to shopping list with batch processing
        const addedItems: ShoppingItem[] = [];
        const batchSize = 10; // Process in batches to avoid overwhelming the database

        for (let i = 0; i < ingredientsToAdd.length; i += batchSize) {
          const batch = ingredientsToAdd.slice(i, i + batchSize);
          const batchPromises = batch.map((ingredient) =>
            addShoppingItem(defaultList!.id, ingredient)
          );

          try {
            const batchResults = await Promise.allSettled(batchPromises);
            batchResults.forEach((result, index) => {
              if (result.status === "fulfilled") {
                addedItems.push(result.value);
              } else {
                console.warn(
                  `[GroceriesService] Failed to add ingredient ${batch[index].name}:`,
                  result.reason
                );
              }
            });
          } catch (error) {
            console.error("[GroceriesService] Batch processing error:", error);
          }
        }

        console.log(
          `[GroceriesService] Added ${addedItems.length}/${ingredientsToAdd.length} ingredients to shopping list`
        );

        // Return updated shopping list
        return {
          ...defaultList,
          items: [...(defaultList.items || []), ...addedItems],
        };
      } catch (error) {
        if (error instanceof GroceriesServiceError) {
          throw error;
        }
        throw GroceriesServiceError.fromSupabaseError(error);
      }
    },
    { maxRetries: 2 }
  );
};

// Enhanced consolidation with better duplicate detection
export const consolidateShoppingListItems = async (
  listId: string
): Promise<void> => {
  return withNetworkRetry(
    async () => {
      try {
        console.log("[GroceriesService] Consolidating shopping list items");

        const { data: items, error } = await supabase
          .from("shopping_items")
          .select("*")
          .eq("shopping_list_id", listId);

        if (error) {
          throw GroceriesServiceError.fromSupabaseError(error);
        }

        if (!items || items.length === 0) {
          console.log("[GroceriesService] No items to consolidate");
          return;
        }

        // Group items by name (case-insensitive) and unit
        const itemGroups = new Map<string, ShoppingItem[]>();

        items.forEach((item) => {
          const key = `${item.name.toLowerCase().trim()}_${(item.unit || "")
            .toLowerCase()
            .trim()}`;
          if (!itemGroups.has(key)) {
            itemGroups.set(key, []);
          }
          itemGroups.get(key)!.push(item);
        });

        // Process groups with duplicates
        const consolidationPromises: Promise<any>[] = [];

        itemGroups.forEach((group, key) => {
          if (group.length > 1) {
            console.log(
              `[GroceriesService] Consolidating ${group.length} items for: ${key}`
            );

            // Keep the first item and merge quantities
            const [keepItem, ...duplicates] = group;

            // Calculate total quantity (simple addition for now)
            const totalQuantity = group.reduce((sum, item) => {
              const qty = parseFloat(item.quantity) || 1;
              return sum + qty;
            }, 0);

            // Update the kept item with consolidated quantity
            consolidationPromises.push(
              updateShoppingItem(keepItem.id, {
                quantity: totalQuantity.toString(),
              })
            );

            // Remove duplicate items
            duplicates.forEach((duplicate) => {
              consolidationPromises.push(removeShoppingItem(duplicate.id));
            });
          }
        });

        if (consolidationPromises.length > 0) {
          await Promise.allSettled(consolidationPromises);
          console.log(
            `[GroceriesService] Completed consolidation with ${consolidationPromises.length} operations`
          );
        } else {
          console.log("[GroceriesService] No duplicates found to consolidate");
        }
      } catch (error) {
        if (error instanceof GroceriesServiceError) {
          throw error;
        }
        throw GroceriesServiceError.fromSupabaseError(error);
      }
    },
    { maxRetries: 2 }
  );
};
