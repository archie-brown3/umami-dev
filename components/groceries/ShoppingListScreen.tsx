import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../utils/styleUtils";
import { useGroceries } from "../../context/GroceriesContext";
import ShoppingItemCard from "./shopping/ShoppingItemCard";
import AddItemButton from "./shared/AddItemButton";

const ShoppingListScreen: React.FC = () => {
  const {
    shoppingList,
    setActiveView,
    toggleShoppingItem,
    removeShoppingItem,
    isLoading,
    error,
  } = useGroceries();

  const [searchQuery, setSearchQuery] = useState("");

  // Set the active view when this screen is focused
  useEffect(() => {
    setActiveView("shopping");
  }, [setActiveView]);

  // Filter shopping list items based on search query
  const filteredItems = shoppingList.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
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
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color={colors.gray[500]}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search shopping list"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          placeholderTextColor={colors.gray[400]}
        />
      </View>

      {filteredItems.length > 0 ? (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ShoppingItemCard
              item={item}
              onToggle={() => toggleShoppingItem(item.id)}
              onDelete={() => removeShoppingItem(item.id)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          {searchQuery ? (
            <>
              <Ionicons name="search" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyText}>No matching items found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your search</Text>
            </>
          ) : (
            <>
              <Ionicons
                name="cart-outline"
                size={64}
                color={colors.gray[300]}
              />
              <Text style={styles.emptyText}>Your shopping list is empty</Text>
              <Text style={styles.emptySubtext}>
                Add items to your shopping list to get started
              </Text>
            </>
          )}
        </View>
      )}

      <AddItemButton screenType="shopping" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.dark,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 80, // Extra space at bottom for FAB
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.gray[700],
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: "center",
    marginTop: spacing.sm,
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
});

export default ShoppingListScreen;
