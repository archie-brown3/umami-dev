import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
  SectionList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "../../utils/styleUtils";
import { useGroceries } from "../../context/GroceriesContext";
import { useRecipes } from "../../context/RecipeContext";
import ShoppingItemCard from "./shopping/ShoppingItemCard";
import AddItemButton from "./shared/AddItemButton";
import CompleteShoppingButton from "./shopping/CompleteShoppingButton";

const ShoppingListScreen: React.FC = () => {
  const {
    shoppingList,
    setActiveView,
    isLoading,
    error,
    defaultShoppingList,
    addItemToShoppingList,
    toggleItemInShoppingList,
    removeItemFromShoppingList,
    updateShoppingItemInList,
  } = useGroceries();

  const { recipes } = useRecipes();
  const [searchQuery, setSearchQuery] = useState("");

  // Set the active view when this screen is focused
  useEffect(() => {
    setActiveView("shopping");
  }, [setActiveView]);

  // Group shopping list items by recipe and filter by search
  const groupedItems = useMemo(() => {
    // Filter items based on search query
    const filteredItems = shoppingList.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group items by recipe
    const recipeGroups: Record<string, any[]> = {};
    const ungroupedItems: any[] = [];

    filteredItems.forEach((item) => {
      if (item.recipeId) {
        if (!recipeGroups[item.recipeId]) {
          recipeGroups[item.recipeId] = [];
        }
        recipeGroups[item.recipeId].push(item);
      } else {
        ungroupedItems.push(item);
      }
    });

    // Create sections for SectionList
    const sections = [];

    // Add recipe sections
    Object.entries(recipeGroups).forEach(([recipeId, items]) => {
      const recipe = recipes.find((r) => r.id === recipeId);
      sections.push({
        title: recipe?.title || "Unknown Recipe",
        data: items,
        isRecipe: true,
        recipeId,
        recipe,
      });
    });

    // Add ungrouped items section if any
    if (ungroupedItems.length > 0) {
      sections.push({
        title: "Other Items",
        data: ungroupedItems,
        isRecipe: false,
      });
    }

    return sections;
  }, [shoppingList, searchQuery, recipes]);

  const handleAddItem = async (itemData: {
    name: string;
    quantity?: string;
    unit?: string;
  }) => {
    try {
      await addItemToShoppingList({
        name: itemData.name,
        quantity: itemData.quantity,
        unit: itemData.unit,
        checked: false,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to add item to shopping list");
    }
  };

  const handleToggleItem = async (itemId: string) => {
    try {
      await toggleItemInShoppingList(itemId);
    } catch (error) {
      Alert.alert("Error", "Failed to update item");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await removeItemFromShoppingList(itemId);
    } catch (error) {
      Alert.alert("Error", "Failed to remove item");
    }
  };

  const handleUpdateItem = async (
    itemId: string,
    updates: { name?: string; quantity?: string; unit?: string }
  ) => {
    try {
      await updateShoppingItemInList(itemId, updates);
    } catch (error) {
      Alert.alert("Error", "Failed to update item");
    }
  };

  const renderSearchBar = () => {
    if (!shoppingList || shoppingList.length === 0) return null;

    return (
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.gray[400]} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.gray[400]}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderEmptyState = () => {
    if (!shoppingList || shoppingList.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons
            name="add-circle-outline"
            size={64}
            color={colors.gray[300]}
          />
          <Text style={styles.emptyStateTitle}>Empty Shopping List</Text>
          <Text style={styles.emptyStateText}>
            Add items to your shopping list to get started.
          </Text>
        </View>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading shopping list...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={colors.red[500]}
        />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderSearchBar()}
      {renderEmptyState()}

      {shoppingList && shoppingList.length > 0 && (
        <SectionList
          sections={groupedItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ShoppingItemCard
              item={item}
              onToggle={() => handleToggleItem(item.id)}
              onDelete={() => handleRemoveItem(item.id)}
              onUpdate={(updates) => handleUpdateItem(item.id, updates)}
            />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderContent}>
                {section.isRecipe && (
                  <Ionicons
                    name="restaurant-outline"
                    size={18}
                    color={colors.primary}
                    style={styles.sectionIcon}
                  />
                )}
                <View style={styles.sectionTextContainer}>
                  <Text style={styles.sectionHeaderText}>{section.title}</Text>
                  <Text style={styles.sectionItemCount}>
                    {section.data.length} item
                    {section.data.length !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={true}
        />
      )}

      <View style={styles.bottomActions}>
        <AddItemButton screenType="shopping" />
        <CompleteShoppingButton />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.gray[600],
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.red[500],
    textAlign: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: 16,
    color: colors.dark,
  },
  listContainer: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.dark,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: "center",
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  bottomActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    padding: spacing.md,
  },
  sectionHeader: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    marginRight: spacing.sm,
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: 2,
  },
  sectionItemCount: {
    fontSize: 12,
    color: colors.gray[500],
    fontWeight: "500",
  },
});

export default ShoppingListScreen;
