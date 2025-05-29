import { useMemo } from "react";
import { useGroceries } from "../context/GroceriesContext";
import { Ingredient } from "../types";

export type IngredientStatus = "insufficient" | "partial" | "sufficient";

export interface IngredientStatusInfo {
  status: IngredientStatus;
  availableQuantity: number;
  requiredQuantity: number;
  unit: string;
  color: string;
}

export type IngredientStatusMap = Record<string, IngredientStatusInfo>;

/**
 * Custom hook to check ingredient status by comparing recipe ingredients with cupboard inventory
 * Returns a map of ingredient names to their status information
 */
export const useIngredientStatus = (
  recipeIngredients: Ingredient[]
): IngredientStatusMap => {
  const { cupboardItems } = useGroceries();

  return useMemo(() => {
    const statusMap: IngredientStatusMap = {};

    recipeIngredients.forEach((ingredient) => {
      const matchingCupboardItem = cupboardItems.find(
        (cupboardItem) =>
          cupboardItem.name.toLowerCase() === ingredient.name.toLowerCase()
      );

      if (!matchingCupboardItem) {
        // Not in cupboard at all
        statusMap[ingredient.name] = {
          status: "insufficient",
          availableQuantity: 0,
          requiredQuantity: ingredient.amount,
          unit: ingredient.unit,
          color: "#EF4444", // Red
        };
      } else {
        const available = matchingCupboardItem.quantity || 0;
        const required = ingredient.amount;

        if (available >= required) {
          // Sufficient quantity
          statusMap[ingredient.name] = {
            status: "sufficient",
            availableQuantity: available,
            requiredQuantity: required,
            unit: ingredient.unit,
            color: "#10B981", // Green
          };
        } else {
          // Partial quantity
          statusMap[ingredient.name] = {
            status: "partial",
            availableQuantity: available,
            requiredQuantity: required,
            unit: ingredient.unit,
            color: "#F59E0B", // Orange
          };
        }
      }
    });

    return statusMap;
  }, [recipeIngredients, cupboardItems]);
};

/**
 * Helper hook to check if a specific ingredient is in the shopping list
 */
export const useShoppingListStatus = (ingredientName: string): boolean => {
  const { defaultShoppingList } = useGroceries();

  return useMemo(() => {
    const shoppingListItems = defaultShoppingList?.items || [];
    return shoppingListItems.some(
      (item) => item.name.toLowerCase() === ingredientName.toLowerCase()
    );
  }, [defaultShoppingList?.items, ingredientName]);
};
