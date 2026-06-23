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
import {
  groupItemsByCategory,
  getCategoryInfo,
} from "../../utils/groceryUtils";

const ShoppingListScreen: React.FC = () => {
  const {
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

  // Get shopping list items from defaultShoppingList
  const shoppingListItems = defaultShoppingList?.items || [];

  // Group shopping list items by supermarket category and filter by search
  const groupedItems = useMemo(() => {
    // Filter items based on search query
    const filteredItems = shoppingListItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Separate checked and unchecked items
    const uncheckedItems = filteredItems.filter((item) => !item.checked);
    const checkedItems = filteredItems.filter((item) => item.checked);

    // Group unchecked items by supermarket category
    const categoryGroups = groupItemsByCategory(uncheckedItems);

    // Create sections for SectionList
    const sections = Object.entries(categoryGroups).map(
      ([categoryName, items]) => {
        const categoryInfo = getCategoryInfo(categoryName);

        return {
          title: categoryName,
          data: items,
          isCategory: true,
          categoryInfo,
        };
      }
    );

    // Add completed items section if there are any checked items
    if (checkedItems.length > 0) {
      sections.push({
        title: "Completed Items",
        data: checkedItems,
        isCategory: true,
        categoryInfo: {
          name: "Completed Items",
          icon: "checkmark-circle",
          color: "#22C55E",
        },
      });
    }

    return sections;
  }, [shoppingListItems, searchQuery]);

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

  const handleMarkAllComplete = async () => {
    try {
      const uncheckedItems = shoppingListItems.filter((item) => !item.checked);

      if (uncheckedItems.length === 0) {
        Alert.alert("All Done!", "All items are already checked off.");
        return;
      }

      Alert.alert(
        "Mark All Complete",
        `Mark all ${uncheckedItems.length} remaining items as complete?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Mark All",
            onPress: async () => {
              try {
                // Mark all unchecked items as checked
                const updatePromises = uncheckedItems.map((item) =>
                  updateShoppingItemInList(item.id, { checked: true })
                );

                await Promise.all(updatePromises);

                Alert.alert(
                  "All Complete! ✅",
                  "All items have been marked as complete.",
                  [{ text: "OK" }]
                );
              } catch (error) {
                Alert.alert("Error", "Failed to mark all items as complete");
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to mark all items as complete");
    }
  };

  const renderSearchBar = () => {
    if (!shoppingListItems || shoppingListItems.length === 0) return null;

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
    if (!shoppingListItems || shoppingListItems.length === 0) {
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

      <View style={styles.listWrapper}>
        {shoppingListItems && shoppingListItems.length > 0 && (
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
                  <Ionicons
                    name={section.categoryInfo.icon as any}
                    size={16}
                    color={section.categoryInfo.color}
                    style={styles.sectionIcon}
                  />
                  <View style={styles.sectionTextContainer}>
                    <Text style={styles.sectionHeaderText}>
                      {section.title}
                    </Text>
                    <Text style={styles.sectionItemCount}>
                      {section.data.length} item
                      {section.data.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            ListFooterComponent={() => (
              <View style={styles.bottomActions}>
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    style={styles.markAllButton}
                    onPress={handleMarkAllComplete}
                  >
                    <Ionicons
                      name="checkmark-done"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.markAllButtonText}>Mark All</Text>
                  </TouchableOpacity>
                </View>
                <CompleteShoppingButton />
              </View>
            )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={true}
          />
        )}
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
    marginHorizontal: spacing.sm,
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
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
  listWrapper: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
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
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    padding: spacing.md,
    marginTop: spacing.md,
  },
  sectionHeader: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
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
    marginRight: spacing.xs,
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionHeaderText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: 1,
  },
  sectionItemCount: {
    fontSize: 11,
    color: colors.gray[500],
    fontWeight: "500",
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  markAllButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary[700],
  },
});

export default ShoppingListScreen;
