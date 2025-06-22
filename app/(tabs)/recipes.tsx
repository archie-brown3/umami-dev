import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { colors, spacing, borderRadius, typography } from "@/utils/styleUtils";
import { useRecipes } from "@/context/RecipeContext";
import { useAuth } from "@/context/AuthContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { Recipe } from "@/types";
import { Paywall } from "@/components/subscription/Paywall";
import EmptyState from "@/components/common/EmptyState";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import CategorizedTagFilter from "@/components/recipes/CategorizedTagFilter";
import { eventEmitter, EVENTS } from "@/utils/eventEmitter";
import { getUserRecipes } from "@/services/recipeService";
import RecipeList from "@/components/recipes/RecipeList";

export default function RecipesScreen() {
  const insets = useSafeAreaInsets();
  const { recipes } = useRecipes();
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
