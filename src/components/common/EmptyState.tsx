import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors, spacing, borderRadius } from "@/utils/styleUtils";

interface EmptyStateProps {
  title: string;
  message: string;
  actionLabel?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  onActionClick?: () => void;
}

export default function EmptyState({
  title,
  message,
  actionLabel,
  iconName = "document-outline",
  onActionClick,
}: EmptyStateProps) {
  const handleActionClick = () => {
    if (onActionClick) {
      onActionClick();
    } else if (actionLabel === "Add Recipe") {
      router.push("/add-recipe");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={64} color={colors.gray[400]} />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        {actionLabel && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleActionClick}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={20} color={colors.white} />
            <Text style={styles.actionButtonText}>{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  content: {
    alignItems: "center",
    maxWidth: 300,
  },
  iconContainer: {
    marginBottom: spacing.lg,
    opacity: 0.6,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: "center",
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 16,
    marginLeft: spacing.xs,
  },
});
