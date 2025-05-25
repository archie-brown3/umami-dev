import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../utils/styleUtils";
import { Ingredient } from "../../types";
import { useGroceries } from "../../context/GroceriesContext";
import {
  useIngredientStatus,
  useShoppingListStatus,
} from "../../hooks/useIngredientStatus";

interface RecipeIngredientRowProps {
  ingredient: Ingredient;
  recipeId?: string;
  showStatus?: boolean;
  showAddToShoppingList?: boolean;
}

const RecipeIngredientRow: React.FC<RecipeIngredientRowProps> = ({
  ingredient,
  recipeId,
  showStatus = true,
  showAddToShoppingList = true,
}) => {
  const { addShoppingItem, removeShoppingItem, shoppingList } = useGroceries();
  const ingredientStatus = useIngredientStatus([ingredient]);
  const isInShoppingList = useShoppingListStatus(ingredient.name);

  const status = ingredientStatus[ingredient.name];

  // Get icon name for ingredient
  const getIconForIngredient = (ingredientName: string) => {
    const lowerName = ingredientName.toLowerCase();
    if (lowerName.includes("sweet potato") || lowerName.includes("potato"))
      return "restaurant-outline";
    if (lowerName.includes("oil") || lowerName.includes("olive"))
      return "water-outline";
    if (lowerName.includes("garlic")) return "flower-outline";
    if (lowerName.includes("italian") || lowerName.includes("seasoning"))
      return "sparkles-outline";
    if (lowerName.includes("pepper")) return "flame-outline";
    if (lowerName.includes("meat") || lowerName.includes("chicken"))
      return "restaurant-outline";
    if (lowerName.includes("tomato")) return "nutrition-outline";
    if (lowerName.includes("broccoli") || lowerName.includes("vegetable"))
      return "leaf-outline";
    if (lowerName.includes("rice") || lowerName.includes("pasta"))
      return "grid-outline";
    if (lowerName.includes("fish") || lowerName.includes("seafood"))
      return "fish-outline";
    if (lowerName.includes("egg")) return "ellipse-outline";
    if (lowerName.includes("cheese") || lowerName.includes("parmesan"))
      return "square-outline";
    if (lowerName.includes("spice") || lowerName.includes("herb"))
      return "sparkles-outline";
    return "restaurant-outline";
  };

  const handleAddToShoppingList = () => {
    if (isInShoppingList) {
      // Remove from shopping list
      const itemToRemove = shoppingList.find(
        (item) => item.name.toLowerCase() === ingredient.name.toLowerCase()
      );
      if (itemToRemove) {
        removeShoppingItem(itemToRemove.id);
      }
    } else {
      // Add to shopping list
      addShoppingItem({
        name: ingredient.name,
        quantity: ingredient.amount,
        unit: ingredient.unit,
        checked: false,
        recipeId,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.ingredientRow}>
        <View
          style={[
            styles.ingredientCircleIcon,
            showStatus && status && { backgroundColor: status.color + "20" },
          ]}
        >
          <Ionicons
            name={getIconForIngredient(ingredient.name)}
            size={20}
            color={showStatus && status ? status.color : "#F87171"}
          />
        </View>

        <View style={styles.ingredientTextWrap}>
          <Text style={styles.ingredientAmountText}>
            {ingredient.amount} {ingredient.unit}
          </Text>
          <Text> </Text>
          <Text style={styles.ingredientNameText}>{ingredient.name}</Text>

          {showStatus && status && (
            <View style={styles.statusIndicator}>
              {status.status === "sufficient" && (
                <View style={styles.statusBadge}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={colors.green[600]}
                  />
                  <Text
                    style={[styles.statusText, { color: colors.green[600] }]}
                  >
                    In cupboard
                  </Text>
                </View>
              )}

              {status.status === "partial" && (
                <View style={styles.statusBadge}>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBackground}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${
                              (status.availableQuantity /
                                status.requiredQuantity) *
                              100
                            }%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <Text style={[styles.statusText, { color: "#D97706" }]}>
                    {status.availableQuantity}/{status.requiredQuantity}{" "}
                    {status.unit}
                  </Text>
                </View>
              )}

              {status.status === "insufficient" && (
                <View style={styles.statusBadge}>
                  <Ionicons
                    name="add-circle-outline"
                    size={16}
                    color={colors.red[500]}
                  />
                  <Text style={[styles.statusText, { color: colors.red[600] }]}>
                    Need to buy
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {showAddToShoppingList && (
          <TouchableOpacity
            style={[
              styles.addButton,
              isInShoppingList && styles.addButtonActive,
            ]}
            onPress={handleAddToShoppingList}
          >
            <Ionicons
              name={isInShoppingList ? "checkmark" : "add"}
              size={16}
              color={isInShoppingList ? colors.white : colors.primary[600]}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  ingredientCircleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  ingredientTextWrap: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },
  ingredientAmountText: {
    fontWeight: "500",
    color: colors.dark,
    fontSize: 15,
  },
  ingredientNameText: {
    fontWeight: "normal",
    color: colors.gray[800],
    fontSize: 15,
    marginLeft: spacing.xs,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
    width: "100%",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.xs,
  },
  progressContainer: {
    width: "100%",
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.gray[200],
    marginRight: spacing.xs,
  },
  progressBackground: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    backgroundColor: colors.gray[300],
  },
  progressFill: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    backgroundColor: "#F59E0B",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary[100],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  addButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
});

export default RecipeIngredientRow;
