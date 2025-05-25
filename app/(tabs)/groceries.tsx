import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { colors } from "../../utils/styleUtils";
import { useGroceries } from "../../context/GroceriesContext";
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
  } = useGroceries();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Groceries",
          headerShadowVisible: false,
        }}
      />
      <GroceriesTabSwitcher />
      <RecipeCarousel
        selectedRecipes={selectedRecipes}
        onAddRecipe={addSelectedRecipe}
        onRemoveRecipe={removeSelectedRecipe}
      />
      {activeView === "shopping" ? <ShoppingListScreen /> : <CupboardScreen />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
