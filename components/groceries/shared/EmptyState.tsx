import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "../../../utils/styleUtils";

interface EmptyStateProps {
  type:
    | "shopping-empty"
    | "shopping-search"
    | "cupboard-empty"
    | "cupboard-search";
  onAction?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction }) => {
  const getContent = () => {
    switch (type) {
      case "shopping-empty":
        return {
          icon: "cart-outline",
          title: "Your shopping list is empty",
          subtitle: "Add ingredients from recipes or create custom items",
          actionText: "Browse Recipes",
          suggestions: [
            "Tap + to add items manually",
            "Visit a recipe and tap ingredients to add them",
            "Use voice input to quickly add multiple items",
          ],
        };
      case "shopping-search":
        return {
          icon: "search-outline",
          title: "No matching items found",
          subtitle: "Try adjusting your search terms",
          actionText: "Clear Search",
        };
      case "cupboard-empty":
        return {
          icon: "cube-outline",
          title: "Your cupboard is empty",
          subtitle: "Complete your shopping to add items here",
          actionText: "Add Items",
          suggestions: [
            "Complete shopping trips to stock your cupboard",
            "Manually add items you already have",
            "Set expiration dates to track freshness",
          ],
        };
      case "cupboard-search":
        return {
          icon: "search-outline",
          title: "No matching items found",
          subtitle: "Try a different search term",
          actionText: "Clear Search",
        };
    }
  };

  const content = getContent();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={content.icon as any}
          size={64}
          color={colors.gray[300]}
        />
      </View>

      <Text style={styles.title}>{content.title}</Text>
      <Text style={styles.subtitle}>{content.subtitle}</Text>

      {content.suggestions && (
        <View style={styles.suggestionsContainer}>
          {content.suggestions.map((suggestion, index) => (
            <View key={index} style={styles.suggestionRow}>
              <View style={styles.bulletPoint} />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </View>
          ))}
        </View>
      )}

      {onAction && (
        <TouchableOpacity style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{content.actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  iconContainer: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.gray[700],
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  suggestionsContainer: {
    alignSelf: "stretch",
    marginBottom: spacing.lg,
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  bulletPoint: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray[600],
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
});

export default EmptyState;
