import { supabase } from "@/lib/supabase";
import { getMealPlans } from "./mealPlanService";

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

// Core CRUD operations for shopping lists
export const createShoppingList = async (
  userId: string,
  list: Partial<ShoppingList>
): Promise<ShoppingList> => {
  try {
    const { data, error } = await supabase
      .from("shopping_lists")
      .insert({
        user_id: userId,
        title: list.title || "New Shopping List",
        date: list.date || new Date().toISOString().split("T")[0],
        total_cost: list.total_cost,
        total_package_cost: list.total_package_cost,
        price_confidence: list.price_confidence,
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, items: [] };
  } catch (error) {
    console.error("Error creating shopping list:", error);
    throw error;
  }
};

export const getShoppingLists = async (
  userId: string
): Promise<ShoppingList[]> => {
  try {
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

    if (error) throw error;

    return data.map((list) => ({
      ...list,
      items: list.shopping_items || [],
    }));
  } catch (error) {
    console.error("Error fetching shopping lists:", error);
    throw error;
  }
};

export const updateShoppingList = async (
  listId: string,
  updates: Partial<ShoppingList>
): Promise<ShoppingList> => {
  try {
    const { data, error } = await supabase
      .from("shopping_lists")
      .update(updates)
      .eq("id", listId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating shopping list:", error);
    throw error;
  }
};

export const deleteShoppingList = async (listId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("shopping_lists")
      .delete()
      .eq("id", listId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting shopping list:", error);
    throw error;
  }
};

// Core CRUD operations for shopping items
export const addShoppingItem = async (
  listId: string,
  item: Partial<ShoppingItem>
): Promise<ShoppingItem> => {
  try {
    const { data, error } = await supabase
      .from("shopping_items")
      .insert({
        shopping_list_id: listId,
        ingredient_id: item.ingredient_id,
        name: item.name || "",
        quantity: item.quantity || "1",
        unit: item.unit,
        category: item.category || "Other",
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

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding shopping item:", error);
    throw error;
  }
};

export const updateShoppingItem = async (
  itemId: string,
  updates: Partial<ShoppingItem>
): Promise<ShoppingItem> => {
  try {
    const { data, error } = await supabase
      .from("shopping_items")
      .update(updates)
      .eq("id", itemId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating shopping item:", error);
    throw error;
  }
};

export const removeShoppingItem = async (itemId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("shopping_items")
      .delete()
      .eq("id", itemId);

    if (error) throw error;
  } catch (error) {
    console.error("Error removing shopping item:", error);
    throw error;
  }
};

// Generate shopping list from meal plan
export const generateShoppingListFromMealPlan = async (
  userId: string,
  dateRange: { start: string; end: string }
): Promise<ShoppingList> => {
  try {
    // Get meal plans for the date range
    const mealPlans = await getMealPlans(userId, dateRange);

    if (mealPlans.length === 0) {
      throw new Error("No meal plans found for the selected date range");
    }

    // Extract all recipe IDs
    const recipeIds = new Set<string>();
    mealPlans.forEach((plan) => {
      plan.items?.forEach((item) => {
        recipeIds.add(item.recipe_id);
      });
    });

    if (recipeIds.size === 0) {
      throw new Error("No recipes found in meal plans");
    }

    // Get recipe ingredients for all recipes
    const { data: recipeIngredients, error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .select(
        `
        recipe_id,
        quantity,
        unit,
        ingredients (
          id,
          name,
          category,
          emoji
        )
      `
      )
      .in("recipe_id", Array.from(recipeIds));

    if (ingredientsError) throw ingredientsError;

    // Create shopping list
    const shoppingList = await createShoppingList(userId, {
      title: `Shopping List - ${dateRange.start} to ${dateRange.end}`,
      date: new Date().toISOString().split("T")[0],
    });

    // Group and consolidate ingredients
    const consolidatedIngredients = new Map<
      string,
      {
        name: string;
        category: string;
        emoji?: string;
        quantities: { quantity: string; unit?: string; recipeId: string }[];
      }
    >();

    recipeIngredients?.forEach((ri) => {
      if (ri.ingredients && !Array.isArray(ri.ingredients)) {
        const ingredient = ri.ingredients as {
          id: string;
          name: string;
          category: string;
          emoji?: string;
        };
        const key = ingredient.name.toLowerCase();
        if (!consolidatedIngredients.has(key)) {
          consolidatedIngredients.set(key, {
            name: ingredient.name,
            category: ingredient.category || "Other",
            emoji: ingredient.emoji,
            quantities: [],
          });
        }

        consolidatedIngredients.get(key)?.quantities.push({
          quantity: ri.quantity || "1",
          unit: ri.unit,
          recipeId: ri.recipe_id,
        });
      }
    });

    // Add items to shopping list
    for (const [_, ingredient] of consolidatedIngredients) {
      // For now, just combine quantities as text
      // In a more sophisticated version, we'd parse and sum numeric quantities
      const combinedQuantity = ingredient.quantities
        .map((q) => `${q.quantity}${q.unit ? ` ${q.unit}` : ""}`)
        .join(", ");

      await addShoppingItem(shoppingList.id, {
        name: ingredient.name,
        quantity: combinedQuantity,
        category: ingredient.category,
        emoji: ingredient.emoji,
        checked: false,
      });
    }

    // Return the shopping list with items
    const updatedList = await getShoppingLists(userId);
    return (
      updatedList.find((list) => list.id === shoppingList.id) || shoppingList
    );
  } catch (error) {
    console.error("Error generating shopping list from meal plan:", error);
    throw error;
  }
};

// Consolidate duplicate items in a shopping list
export const consolidateShoppingListItems = async (
  listId: string
): Promise<void> => {
  try {
    const { data: items, error } = await supabase
      .from("shopping_items")
      .select("*")
      .eq("shopping_list_id", listId);

    if (error) throw error;

    // Group items by name (case-insensitive)
    const itemGroups = new Map<string, ShoppingItem[]>();
    items?.forEach((item) => {
      const key = item.name.toLowerCase().trim();
      if (!itemGroups.has(key)) {
        itemGroups.set(key, []);
      }
      itemGroups.get(key)?.push(item);
    });

    // Consolidate groups with multiple items
    for (const [_, group] of itemGroups) {
      if (group.length > 1) {
        // Keep the first item, update its quantity, delete the rest
        const primaryItem = group[0];
        const otherItems = group.slice(1);

        // Combine quantities (simple text concatenation for now)
        const combinedQuantity = group
          .map((item) => `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`)
          .join(", ");

        // Update primary item
        await updateShoppingItem(primaryItem.id, {
          quantity: combinedQuantity,
        });

        // Delete other items
        for (const item of otherItems) {
          await removeShoppingItem(item.id);
        }
      }
    }
  } catch (error) {
    console.error("Error consolidating shopping list items:", error);
    throw error;
  }
};
