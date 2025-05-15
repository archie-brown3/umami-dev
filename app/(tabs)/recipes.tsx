import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../components/ui/EmptyState";
import { colors, spacing } from "../utils/styleUtils";
import { RecipeCard } from "../components/recipes/RecipeCard";
import { useRecipes } from "../context/RecipeContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Recipe } from "../types";

export default function RecipesScreen() {
  const { recipes, addRecipe } = useRecipes();
  const filtersScrollRef = useRef<ScrollView>(null);

  // Add sample recipes for demo purposes
  useEffect(() => {
    if (recipes.length === 0) {
      // Sample recipes to show on initial load
      const sampleRecipes = [
        {
          id: "1",
          title: "Crispy Parmesan Sweet Potatoes",
          description:
            "A delicious and crispy twist on sweet potatoes, perfect as a side dish for eggs, chicken, fish, or veggie bowls.",
          prepTime: 15,
          cookTime: 35,
          servings: 4,
          difficulty: "Easy",
          category: "Side",
          tags: ["Vegetarian", "Gluten Free"],
          author: "Chef Alex Ramsey",
          imageUrl:
            "https://images.unsplash.com/photo-1598373182133-52452f7691ef?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          ingredients: [
            { id: "i1", name: "sweet potatoes", amount: 4, unit: "large" },
            { id: "i2", name: "parmesan cheese", amount: 1, unit: "cup" },
            { id: "i3", name: "olive oil", amount: 2, unit: "tbsp" },
            { id: "i4", name: "garlic", amount: 2, unit: "cloves" },
            { id: "i5", name: "fresh herbs", amount: 2, unit: "tbsp" },
          ],
          instructions: [
            "Preheat oven to 425°F (220°C)",
            "Cut sweet potatoes into wedges",
            "Toss with olive oil, garlic, and seasonings",
            "Sprinkle with parmesan cheese",
            "Bake for 25-30 minutes until crispy and golden",
            "Garnish with fresh herbs before serving",
          ],
        },
        {
          id: "2",
          title: "Chipotle Chicken Wrap",
          description: "Spicy chipotle chicken wrap with fresh veggies",
          prepTime: 15,
          cookTime: 20,
          servings: 2,
          cuisine: "Mexican",
          difficulty: "Easy",
          category: "Lunch",
          tags: ["High Protein", "Everyday"],
          author: "Chef Alex Ramsey",
          imageUrl:
            "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          ingredients: [
            { id: "i5", name: "tortilla", amount: 2, unit: "piece" },
            { id: "i6", name: "chicken breast", amount: 1, unit: "piece" },
            { id: "i7", name: "chipotle sauce", amount: 2, unit: "tbsp" },
            { id: "i8", name: "lettuce", amount: 1, unit: "cup" },
          ],
          instructions: [
            "Cook chicken with spices",
            "Warm tortillas",
            "Assemble wraps with chicken, sauce and veggies",
            "Roll and serve",
          ],
        },
        {
          id: "3",
          title: "High Protein Breakfast Wrap",
          description: "Quick and easy high protein breakfast",
          prepTime: 5,
          cookTime: 5,
          servings: 1,
          difficulty: "Easy",
          category: "Breakfast",
          tags: ["High Protein", "Other"],
          author: "Chef Alex Ramsey",
          imageUrl:
            "https://images.unsplash.com/photo-1626268129514-e2fb84a4a367?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          ingredients: [
            { id: "i9", name: "eggs", amount: 2, unit: "piece" },
            { id: "i10", name: "tortilla", amount: 1, unit: "piece" },
            { id: "i11", name: "cheese", amount: 30, unit: "g" },
            { id: "i12", name: "spinach", amount: 1, unit: "handful" },
          ],
          instructions: [
            "Scramble eggs",
            "Warm tortilla",
            "Add eggs, cheese and spinach to tortilla",
            "Roll up and enjoy",
          ],
        },
        {
          id: "4",
          title: "Smashed dumpling tacos",
          description: "Crunchy veggie dumplings in taco format",
          prepTime: 10,
          cookTime: 15,
          servings: 2,
          difficulty: "Medium",
          category: "Side",
          tags: ["High Protein", "Fry", "Spicy"],
          author: "Chef Alex Ramsey",
          imageUrl:
            "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          ingredients: [
            { id: "i13", name: "dumplings", amount: 8, unit: "piece" },
            { id: "i14", name: "tortillas", amount: 4, unit: "piece" },
            { id: "i15", name: "soy sauce", amount: 2, unit: "tbsp" },
            { id: "i16", name: "garlic", amount: 3, unit: "clove" },
          ],
          instructions: [
            "Cook dumplings until crispy",
            "Heat tortillas",
            "Assemble dumplings in tortillas",
            "Add sauce and toppings",
          ],
        },
        {
          id: "5",
          title: "Pad Thai",
          description: "Classic Pad Thai with rice noodles",
          prepTime: 15,
          cookTime: 15,
          servings: 2,
          cuisine: "Thai",
          difficulty: "Medium",
          category: "Main",
          tags: ["Asian", "Noodles"],
          author: "Chef Alex Ramsey",
          imageUrl:
            "https://images.unsplash.com/photo-1559314809-0d155014e29e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
          ingredients: [
            { id: "i17", name: "rice noodles", amount: 200, unit: "g" },
            { id: "i18", name: "tofu", amount: 100, unit: "g" },
            { id: "i19", name: "bean sprouts", amount: 1, unit: "cup" },
            { id: "i20", name: "peanuts", amount: 2, unit: "tbsp" },
          ],
          instructions: [
            "Soak rice noodles",
            "Stir fry tofu and vegetables",
            "Add noodles and sauce",
            "Top with bean sprouts and crushed peanuts",
          ],
        },
      ];

      // Add each sample recipe to the context
      sampleRecipes.forEach((recipe) => {
        addRecipe(recipe);
      });
    }
  }, [recipes.length, addRecipe]);

  // Debug output
  useEffect(() => {
    console.log("Current recipes:", JSON.stringify(recipes, null, 2));
  }, [recipes]);

  const hasRecipes = recipes.length > 0;

  const renderRecipeCard = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeCardContainer}
      onPress={() => router.push(`/recipe/${item.id}`)}
    >
      <RecipeCard recipe={item} />
    </TouchableOpacity>
  );

  // Debug logs for recipe objects
  useEffect(() => {
    recipes.forEach((recipe) => {
      console.log(`Recipe ${recipe.id} title:`, recipe.title);
    });
  }, [recipes]);

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
          <TouchableOpacity style={styles.tagPill}>
            <Text style={styles.tagText}>Difficulty</Text>
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
