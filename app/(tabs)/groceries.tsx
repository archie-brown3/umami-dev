import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "../../utils/styleUtils";
import { useGroceries } from "../../context/GroceriesContext";
import { useMealPlan } from "../../context/MealPlanContext";
import GroceriesTabSwitcher from "../../components/groceries/GroceriesTabSwitcher";
import ShoppingListScreen from "../../components/groceries/ShoppingListScreen";
import CupboardScreen from "../../components/groceries/CupboardScreen";
import RecipeCarousel from "../../components/groceries/shared/RecipeCarousel";

export default function GroceriesTab() {
  const {
    activeView,
    selectedRecipes,
    addSelectedRecipe,
    removeSelectedRecipe,
    defaultShoppingList,
    refreshShoppingList,
    isLoading,
    error,
  } = useGroceries();

  const { generateShoppingList, currentWeek } = useMealPlan();

  useEffect(() => {
    refreshShoppingList();
  }, []);

  const renderContent = () => {
    if (activeView === "shopping") {
      return <ShoppingListScreen />;
    } else {
      return <CupboardScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Groceries",
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.white,
          },
          headerTitleStyle: {
            fontSize: 24,
            fontWeight: "700",
            color: colors.dark,
          },
          headerShadowVisible: true,
        }}
      />

      <GroceriesTabSwitcher />

      {activeView === "shopping" && (
        <RecipeCarousel
          selectedRecipes={selectedRecipes}
          onAddRecipe={addSelectedRecipe}
          onRemoveRecipe={removeSelectedRecipe}
        />
      )}

      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  scrollContainer: {
    flex: 1,
  },
  headerButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  statsContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[600],
    fontWeight: "500",
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: spacing.xl,
  },
});
