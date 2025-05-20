import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import EmptyState from "@/components/ui/EmptyState";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { useAuth } from "@/context/AuthContext";
import { getUserRecipes } from "@/services/recipeService";
import { colors, spacing, typography } from "@/utils/styleUtils";
import { Recipe } from "@/types";

export default function RecipesScreen() {
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { user } = useAuth();
  const filtersScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const fetchRecipes = async () => {
      if (user?.id) {
        console.log(
          `[RecipesScreen] Attempting to fetch recipes for user: ${user.id}`
        );
        setIsLoading(true);
        try {
          const fetchedRecipesFromService = await getUserRecipes(user.id);
          const conformingRecipes: Recipe[] = fetchedRecipesFromService.map(
            (r) => ({
              ...r,
              id: r.id,
              title: r.title,
              ingredients: r.ingredients || [],
              instructions: r.instructions || [],
              prepTime: r.prepTime || 0,
              cookTime: r.cookTime || 0,
              servings: r.servings || 0,
              createdAt: r.createdAt,
              updatedAt: r.updatedAt,
            })
          );
          setRecipes(conformingRecipes);
          console.log(
            "[RecipesScreen] Successfully set recipes state:",
            JSON.stringify(conformingRecipes, null, 2)
          );
        } catch (error) {
          console.error("[RecipesScreen] Error fetching recipes:", error);
          // Optionally, set an error state here to show to the user
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log(
          "[RecipesScreen] No user found, clearing recipes and not fetching."
        );
        setRecipes([]); // Clear recipes if no user
        setIsLoading(false);
      }
    };

    fetchRecipes();
  }, [user]);

  const hasRecipes = recipes.length > 0;

  const renderRecipeCard = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeCardContainer}
      onPress={() => router.push(`/recipe/${item.id}`)}
    >
      <RecipeCard recipe={item} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Recipes</Text>
        </View>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={{ marginTop: 10, color: colors.gray[600] }}>
            Loading recipes...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isLoading && recipes.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Recipes</Text>
        </View>
        <EmptyState
          title="No Recipes Yet"
          message="Start by adding your first recipe. You can manually add recipes, or extract them from websites, photos, or Instagram."
          actionLabel="Add Recipe"
          iconName="book-outline"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Recipes</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={colors.gray[400]}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            placeholderTextColor={colors.gray[400]}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={20} color={colors.gray[700]} />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersAndTabsContainer}>
        <ScrollView
          ref={filtersScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContainer}
        >
          <TouchableOpacity style={styles.tagPill}>
            <Text style={styles.tagText}>🇺🇸 American</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tagPill}>
            <Text style={styles.tagText}>Bake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tagPill}>
            <Text style={styles.tagText}>Difficulty: Easy</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.tabsContainer}>
          <TouchableOpacity style={[styles.tabButton, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>
              All Recipes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabButton}>
            <Ionicons name="heart-outline" size={18} color={colors.gray[500]} />
            <Text style={styles.tabText}>Favorites</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabButton}>
            <Ionicons
              name="bookmark-outline"
              size={18}
              color={colors.gray[500]}
            />
            <Text style={styles.tabText}>My Lists</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {hasRecipes ? (
          <FlatList
            data={recipes}
            renderItem={renderRecipeCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.recipeGrid}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState showGuide={true} iconName="restaurant-outline" />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.dark,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 8,
    alignItems: "center",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: colors.dark,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  filterText: {
    marginLeft: 4,
    color: colors.gray[700],
    fontWeight: "500",
  },
  filtersAndTabsContainer: {
    marginBottom: 0,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
  },
  tagPill: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  tagText: {
    color: colors.gray[700],
    fontSize: 14,
    fontWeight: "500",
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginRight: 24,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.gray[500],
    fontWeight: "500",
    marginLeft: 4,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  recipeGrid: {
    paddingVertical: 12,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  recipeCardContainer: {
    width: "48%",
    marginBottom: 20,
    elevation: 2,
  },
});
