import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  colors,
  spacing,
  borderRadius,
  fontSizes,
  createShadow,
} from "../../utils/styleUtils";

// Valid path type for Expo Router
type ValidRouterPath = string;

interface ActionButton {
  label: string;
  path?: ValidRouterPath;
  onClick?: () => void;
  iconName?: keyof typeof Ionicons.glyphMap;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "destructive"
    | "ghost"
    | "link";
}

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  actionPath?: ValidRouterPath;
  iconName?: keyof typeof Ionicons.glyphMap;
  onActionClick?: () => void;
  actions?: ActionButton[];
  showGuide?: boolean;
}

/**
 * EmptyState component for displaying when no data is available
 * Defaults to showing a message about no recipes with a CTA to add a new one
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No Recipes Found",
  message = "You don't have any recipes yet. Add your first recipe to get started.",
  actionLabel = "Add New Recipe",
  actionPath = "/add-recipe",
  iconName = "restaurant-outline",
  onActionClick,
  actions = [],
  showGuide = false,
}) => {
  const handleClick = (action?: ActionButton) => {
    if (action?.onClick) {
      action.onClick();
    } else if (action?.path) {
      // Check if it's the add-recipe path
      if (action.path === "/add-recipe") {
        router.push({
          pathname: "/add-recipe",
          params: { tab: "instagram" },
        });
      } else {
        router.push(action.path as any);
      }
    } else if (onActionClick) {
      onActionClick();
    } else if (actionPath) {
      // Check if it's the add-recipe path
      if (actionPath === "/add-recipe") {
        router.push({
          pathname: "/add-recipe",
          params: { tab: "instagram" },
        });
      } else {
        router.push(actionPath as any);
      }
    }
  };

  // If no actions provided, use the default action
  const allActions =
    actions.length > 0
      ? actions
      : [{ label: actionLabel, path: actionPath, onClick: onActionClick }];

  const getButtonStyle = (variant: string = "default") => {
    switch (variant) {
      case "outline":
        return [styles.button, styles.outlineButton];
      case "secondary":
        return [styles.button, styles.secondaryButton];
      case "ghost":
        return [styles.button, styles.ghostButton];
      default:
        return [styles.button, styles.defaultButton];
    }
  };

  const getButtonTextStyle = (variant: string = "default") => {
    switch (variant) {
      case "outline":
      case "ghost":
        return [styles.buttonText, styles.outlineButtonText];
      default:
        return [styles.buttonText, styles.defaultButtonText];
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={48} color={colors.gray[400]} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.actionsContainer}>
          {allActions.map((action, index) => (
            <Pressable
              key={index}
              style={getButtonStyle(action.variant)}
              onPress={() => handleClick(action)}
              android_ripple={{ color: colors.primaryLight }}
            >
              {action.iconName && (
                <Ionicons
                  name={action.iconName}
                  size={20}
                  color={
                    action.variant === "outline" ? colors.primary : colors.white
                  }
                  style={styles.buttonIcon}
                />
              )}
              <Text style={getButtonTextStyle(action.variant)}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {showGuide && (
          <View style={styles.guideContainer}>
            <Text style={styles.guideTitle}>
              Ways to add your first recipe:
            </Text>

            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/add-recipe",
                  params: { tab: "instagram" },
                })
              }
              android_ripple={{ color: colors.gray[100] }}
            >
              <View
                style={[
                  styles.cardIconContainer,
                  { backgroundColor: colors.primaryLight + "20" },
                ]}
              >
                <Ionicons
                  name="logo-instagram"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Extract from Instagram</Text>
                <Text style={styles.cardDescription}>
                  Paste an Instagram recipe post URL
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.gray[400]}
              />
            </Pressable>

            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/add-recipe",
                  params: { tab: "url" },
                })
              }
              android_ripple={{ color: colors.gray[100] }}
            >
              <View
                style={[
                  styles.cardIconContainer,
                  { backgroundColor: colors.primaryLight + "20" },
                ]}
              >
                <Ionicons
                  name="globe-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Extract from a website</Text>
                <Text style={styles.cardDescription}>
                  Paste a URL from any recipe website
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.gray[400]}
              />
            </Pressable>

            <Pressable
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/add-recipe",
                  params: { tab: "manual" },
                })
              }
              android_ripple={{ color: colors.gray[100] }}
            >
              <View
                style={[
                  styles.cardIconContainer,
                  { backgroundColor: colors.primaryLight + "20" },
                ]}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Add manually</Text>
                <Text style={styles.cardDescription}>
                  Type in your own recipe details
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.gray[400]}
              />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: spacing.md,
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: borderRadius.full,
  },
  title: {
    fontSize: fontSizes.lg,
    fontWeight: "600",
    color: colors.gray[900],
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  message: {
    fontSize: fontSizes.sm,
    color: colors.gray[500],
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    minWidth: 120,
    marginHorizontal: spacing.xs,
    marginBottom: spacing.xs,
  },
  defaultButton: {
    backgroundColor: colors.primary,
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  ghostButton: {
    backgroundColor: "transparent",
  },
  buttonText: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
  },
  defaultButtonText: {
    color: colors.white,
  },
  outlineButtonText: {
    color: colors.primary,
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  guideContainer: {
    width: "100%",
    marginTop: spacing["2xl"],
  },
  guideTitle: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.gray[700],
    marginBottom: spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...createShadow(2, 0.1, 4),
  },
  cardIconContainer: {
    padding: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: fontSizes.sm,
    fontWeight: "600",
    color: colors.gray[900],
  },
  cardDescription: {
    fontSize: fontSizes.xs,
    color: colors.gray[500],
  },
});

export default EmptyState;
