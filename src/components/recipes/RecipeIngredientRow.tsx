import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors, spacing } from "../../utils/styleUtils";
import { Ingredient } from "../../types";
import { useGroceries } from "../../context/GroceriesContext";
import {
  useIngredientStatus,
  useShoppingListStatus,
} from "../../hooks/useIngredientStatus";
import { formatScaledAmount } from "../../utils/recipeScaling";

interface RecipeIngredientRowProps {
  ingredient: Ingredient;
  recipeId?: string;
  showStatus?: boolean;
  showAddToShoppingList?: boolean;
  scaledAmount?: number; // Optional scaled amount to display instead of original
  isScaled?: boolean; // Whether this ingredient is currently scaled
}

const RecipeIngredientRow: React.FC<RecipeIngredientRowProps> = ({
  ingredient,
  recipeId,
  showStatus = true,
  showAddToShoppingList = true,
  scaledAmount,
  isScaled,
}) => {
  const {
    addItemToShoppingList,
    removeItemFromShoppingList,
    defaultShoppingList,
  } = useGroceries();
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

  const handleAddToShoppingList = async () => {
    try {
      // Provide immediate haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      if (isInShoppingList) {
        // Remove from shopping list - find the item in defaultShoppingList
        const shoppingListItems = defaultShoppingList?.items || [];
        const itemToRemove = shoppingListItems.find(
          (item) => item.name.toLowerCase() === ingredient.name.toLowerCase()
        );
        if (itemToRemove) {
          await removeItemFromShoppingList(itemToRemove.id);
        }
      } else {
        // Add to shopping list using the correct Supabase method
        await addItemToShoppingList({
          name: ingredient.name,
          quantity: ingredient.amount?.toString() || "1",
          unit: ingredient.unit,
          checked: false,
          recipe_id: recipeId,
        });
      }

      // Provide success haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error(
        "[RecipeIngredientRow] Error updating shopping list:",
        error
      );
      // Provide error haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.ingredientRow}>
        <View
          style={[
            styles.ingredientCircleIcon,
            showStatus &&
              status && {
                backgroundColor: status.color + "15",
                borderWidth: 2,
                borderColor: status.color + "30",
              },
          ]}
        >
          <Ionicons
            name={getIconForIngredient(ingredient.name)}
            size={20}
            color={showStatus && status ? status.color : colors.primary[600]}
          />
        </View>

        <View style={styles.ingredientTextWrap}>
          <View style={styles.amountContainer}>
            <Text
              style={[
                styles.ingredientAmountText,
                isScaled && styles.scaledAmountText,
              ]}
            >
              {scaledAmount
                ? formatScaledAmount(scaledAmount)
                : ingredient.amount}{" "}
              {ingredient.unit}
            </Text>
            {isScaled && (
              <Ionicons
                name="resize-outline"
                size={12}
                color={colors.blue[600]}
                style={styles.scaledIcon}
              />
            )}
          </View>
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
                    In basket
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
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel={
              isInShoppingList
                ? `Remove ${ingredient.name} from shopping list`
                : `Add ${ingredient.name} to shopping list`
            }
            accessibilityRole="button"
            accessibilityHint={
              isInShoppingList
                ? "Double tap to remove this ingredient from your shopping list"
                : "Double tap to add this ingredient to your shopping list"
            }
          >
            <Ionicons
              name={isInShoppingList ? "basket" : "basket-outline"}
              size={18}
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
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ingredientAmountText: {
    fontWeight: "500",
    color: colors.dark,
    fontSize: 15,
  },
  scaledAmountText: {
    color: colors.blue[600],
    fontWeight: "600",
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.primary[600],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  addButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
    shadowColor: colors.primary[600],
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    transform: [{ scale: 1.05 }],
  },
  scaledIcon: {
    marginLeft: spacing.xs,
  },
});

export default RecipeIngredientRow;
