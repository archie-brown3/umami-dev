import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/utils/styleUtils";
import { useRecipes } from "@/context/RecipeContext";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import RecipeList from "@/components/recipes/RecipeList";

export default function RecipesScreen() {
  const insets = useSafeAreaInsets();
  const { recipes, refreshRecipes, isLoading } = useRecipes();
  const { user } = useAuth();
  const { isPremium, presentPaywall } = useSubscription();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <RecipeList
        recipes={recipes}
        onPremiumFeaturePress={(feature) => presentPaywall(feature)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
});
