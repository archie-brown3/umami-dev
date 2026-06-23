import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRecipes } from "@/context/RecipeContext";
import { Recipe } from "@/types";
import { colors } from "@/utils/styleUtils";

interface RecipePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectRecipe: (recipeId: string) => void;
  mealType: string;
  date: string;
}

const RecipePicker: React.FC<RecipePickerProps> = ({
  visible,
  onClose,
  onSelectRecipe,
  mealType,
  date,
}) => {
  const { recipes } = useRecipes();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Get unique categories from recipes
  const categories = useMemo(() => {
    const cats = new Set(["all"]);
    recipes.forEach((recipe) => {
      if (recipe.category) {
        cats.add(recipe.category);
      }
    });
    return Array.from(cats);
  }, [recipes]);

  // Filter recipes based on search and category
  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const matchesSearch =
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || recipe.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [recipes, searchQuery, selectedCategory]);

  // Get recent recipes (last 10 used)
  const recentRecipes = useMemo(() => {
    return recipes
      .filter((recipe) => recipe.updatedAt)
      .sort(
        (a, b) =>
          new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime()
      )
      .slice(0, 10);
  }, [recipes]);

  // Get favorite recipes
  const favoriteRecipes = useMemo(() => {
    return recipes.filter((recipe) => recipe.isFavorite);
  }, [recipes]);

  const handleSelectRecipe = (recipe: Recipe) => {
    onSelectRecipe(recipe.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeItem}
      onPress={() => handleSelectRecipe(item)}
    >
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.recipeImage} />
      ) : (
        <View style={[styles.recipeImage, styles.placeholderImage]}>
          <Ionicons name="image-outline" size={24} color={colors.gray[400]} />
        </View>
      )}

      <View style={styles.recipeContent}>
        <Text style={styles.recipeTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.description && (
          <Text style={styles.recipeDescription} numberOfLines={1}>
            {item.description}
          </Text>
        )}
        <View style={styles.recipeMetadata}>
          {item.prepTime && (
            <View style={styles.metadataItem}>
              <Ionicons
                name="time-outline"
                size={12}
                color={colors.gray[500]}
              />
              <Text style={styles.metadataText}>{item.prepTime}min</Text>
            </View>
          )}
          {item.category && (
            <View style={styles.metadataItem}>
              <Ionicons
                name="pricetag-outline"
                size={12}
                color={colors.gray[500]}
              />
              <Text style={styles.metadataText}>{item.category}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.recipeActions}>
        {item.isFavorite && (
          <Ionicons name="heart" size={16} color={colors.red[500]} />
        )}
        <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
      </View>
    </TouchableOpacity>
  );

  const renderSection = (title: string, data: Recipe[]) => {
    if (data.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <FlatList
          data={data}
          renderItem={renderRecipeItem}
          keyExtractor={(item) => `${title}-${item.id}`}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.dark} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Add Recipe</Text>
            <Text style={styles.headerSubtitle}>
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)} •{" "}
              {formatDate(date)}
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.gray[400]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={20}
                  color={colors.gray[400]}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter */}
        <View style={styles.categoryContainer}>
          <FlatList
            data={categories}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  selectedCategory === item && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(item)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === item &&
                      styles.categoryButtonTextActive,
                  ]}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Recipe Lists */}
        <FlatList
          style={styles.content}
          showsVerticalScrollIndicator={false}
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={() => (
            <View>
              {searchQuery.length > 0 || selectedCategory !== "all" ? (
                renderSection("Search Results", filteredRecipes)
              ) : (
                <>
                  {renderSection("Favorites", favoriteRecipes)}
                  {renderSection("Recent", recentRecipes)}
                  {renderSection("All Recipes", recipes)}
                </>
              )}

              {filteredRecipes.length === 0 && searchQuery.length > 0 && (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="search-outline"
                    size={48}
                    color={colors.gray[300]}
                  />
                  <Text style={styles.emptyStateText}>No recipes found</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Try adjusting your search or category filter
                  </Text>
                </View>
              )}
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  closeButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: 2,
  },
  headerSpacer: {
    width: 32,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.dark,
  },
  categoryContainer: {
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.gray[600],
  },
  categoryButtonTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  recipeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.gray[200],
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  recipeContent: {
    flex: 1,
    marginLeft: 12,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
    lineHeight: 20,
  },
  recipeDescription: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: 2,
    lineHeight: 18,
  },
  recipeMetadata: {
    flexDirection: "row",
    marginTop: 4,
    gap: 12,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metadataText: {
    fontSize: 12,
    color: colors.gray[500],
    marginLeft: 4,
  },
  recipeActions: {
    alignItems: "center",
    gap: 4,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.gray[400],
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.gray[400],
    textAlign: "center",
    marginTop: 8,
  },
});

export default RecipePicker;
