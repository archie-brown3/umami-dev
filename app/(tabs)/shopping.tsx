import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyState from "../components/ui/EmptyState";
import { colors } from "../utils/styleUtils";

export default function ShoppingScreen() {
  // In a real app, this would come from context
  const hasShoppingList = false;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping List</Text>
      </View>

      <View style={styles.content}>
        {hasShoppingList ? (
          <Text>Shopping list items will appear here</Text>
        ) : (
          <EmptyState
            title="No Shopping List"
            message="Your shopping list is empty. Add ingredients from recipes or create custom items."
            actionLabel="Add Items"
            iconName="cart-outline"
            actions={[
              {
                label: "Add Item",
                iconName: "add-circle-outline",
                variant: "default",
              },
              {
                label: "From Recipes",
                iconName: "book-outline",
                variant: "outline",
              },
            ]}
          />
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
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.dark,
  },
  content: {
    flex: 1,
  },
});
