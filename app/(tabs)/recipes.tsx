import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Recipe } from "../../types/recipe";
import { recipeService } from "../../services/recipeService";

export default function RecipesScreen() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecipes = async () => {
    try {
      const data = await recipeService.getUserRecipes();
      setRecipes(data);
      setError(null);
    } catch (err) {
      setError("Failed to load recipes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecipes();
    setRefreshing(false);
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  const renderRecipeCard = ({ item: recipe }: { item: Recipe }) => (
    <Link
      href={{ pathname: "/recipe/[id]", params: { id: recipe.id } }}
      asChild
    >
      <TouchableOpacity style={styles.recipeCard}>
        <View style={styles.recipeHeader}>
          <Text style={styles.recipeTitle}>{recipe.title}</Text>
          {recipe.is_favorite && (
            <Ionicons name="heart" size={20} color="#ff4757" />
          )}
        </View>

        <View style={styles.recipeDetails}>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {recipe.prep_time + recipe.cook_time} min
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="restaurant-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{recipe.servings} servings</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2B825B" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRecipes}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recipes}
        renderItem={renderRecipeCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recipes found</Text>
            <Text style={styles.emptySubtext}>
              Add your first recipe to get started!
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 16,
  },
  recipeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recipeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  recipeDetails: {
    flexDirection: "row",
    marginTop: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  detailText: {
    marginLeft: 4,
    color: "#666",
    fontSize: 14,
  },
  errorText: {
    color: "#ff4757",
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#2B825B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
