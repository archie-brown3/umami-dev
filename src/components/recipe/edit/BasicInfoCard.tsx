import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Recipe } from "@/types";
import {
  ValidationErrors,
  getCharacterCount,
  VALIDATION_LIMITS,
} from "@/utils/recipeValidation";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  createShadow,
} from "@/utils/styleUtils";

interface BasicInfoCardProps {
  recipe: Recipe;
  onUpdate: <K extends keyof Recipe>(field: K, value: Recipe[K]) => void;
  errors: ValidationErrors;
}

const BasicInfoCard: React.FC<BasicInfoCardProps> = ({
  recipe,
  onUpdate,
  errors,
}) => {
  const titleCount = getCharacterCount(
    recipe.title || "",
    VALIDATION_LIMITS.TITLE.max
  );
  const descCount = getCharacterCount(
    recipe.description || "",
    VALIDATION_LIMITS.DESCRIPTION.max
  );

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Basic Information</Text>

      {/* Title Field */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          Recipe Title *
          <Text
            style={[
              styles.charCount,
              titleCount.isOverLimit && styles.charCountError,
            ]}
          >
            {" "}
            ({titleCount.count}/{VALIDATION_LIMITS.TITLE.max})
          </Text>
        </Text>
        <TextInput
          style={[styles.textInput, errors.title && styles.textInputError]}
          value={recipe.title}
          onChangeText={(text) => onUpdate("title", text)}
          placeholder="Enter recipe title"
          maxLength={VALIDATION_LIMITS.TITLE.max}
          returnKeyType="next"
          autoCapitalize="words"
        />
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
      </View>

      {/* Description Field */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          Description
          <Text
            style={[
              styles.charCount,
              descCount.isOverLimit && styles.charCountError,
            ]}
          >
            {" "}
            ({descCount.count}/{VALIDATION_LIMITS.DESCRIPTION.max})
          </Text>
        </Text>
        <TextInput
          style={[styles.textArea, errors.description && styles.textInputError]}
          value={recipe.description}
          onChangeText={(text) => onUpdate("description", text)}
          placeholder="Describe your recipe..."
          multiline
          numberOfLines={3}
          maxLength={VALIDATION_LIMITS.DESCRIPTION.max}
          textAlignVertical="top"
          autoCapitalize="sentences"
        />
        {errors.description && (
          <Text style={styles.errorText}>{errors.description}</Text>
        )}
      </View>

      {/* Timing and Servings Row */}
      <View style={styles.row}>
        <View style={[styles.fieldContainer, styles.flex1]}>
          <Text style={styles.fieldLabel}>Prep Time (min)</Text>
          <TextInput
            style={[
              styles.numberInput,
              errors.prepTime && styles.textInputError,
            ]}
            value={recipe.prepTime?.toString() || "0"}
            onChangeText={(text) => {
              const numValue = parseInt(text.replace(/[^0-9]/g, "")) || 0;
              onUpdate("prepTime", numValue);
            }}
            placeholder="0"
            keyboardType="numeric"
            maxLength={4}
            returnKeyType="next"
          />
          {errors.prepTime && (
            <Text style={styles.errorText}>{errors.prepTime}</Text>
          )}
        </View>

        <View style={[styles.fieldContainer, styles.flex1, styles.marginLeft]}>
          <Text style={styles.fieldLabel}>Cook Time (min)</Text>
          <TextInput
            style={[
              styles.numberInput,
              errors.cookTime && styles.textInputError,
            ]}
            value={recipe.cookTime?.toString() || "0"}
            onChangeText={(text) => {
              const numValue = parseInt(text.replace(/[^0-9]/g, "")) || 0;
              onUpdate("cookTime", numValue);
            }}
            placeholder="0"
            keyboardType="numeric"
            maxLength={4}
            returnKeyType="next"
          />
          {errors.cookTime && (
            <Text style={styles.errorText}>{errors.cookTime}</Text>
          )}
        </View>

        <View style={[styles.fieldContainer, styles.flex1, styles.marginLeft]}>
          <Text style={styles.fieldLabel}>Servings</Text>
          <TextInput
            style={[
              styles.numberInput,
              errors.servings && styles.textInputError,
            ]}
            value={recipe.servings?.toString() || "1"}
            onChangeText={(text) => {
              const numValue = parseInt(text.replace(/[^0-9]/g, "")) || 1;
              onUpdate("servings", Math.max(1, numValue));
            }}
            placeholder="1"
            keyboardType="numeric"
            maxLength={3}
            returnKeyType="done"
          />
          {errors.servings && (
            <Text style={styles.errorText}>{errors.servings}</Text>
          )}
        </View>
      </View>

      {/* Total Time Display */}
      {(recipe.prepTime > 0 || recipe.cookTime > 0) && (
        <View style={styles.totalTimeContainer}>
          <Ionicons name="time-outline" size={16} color={colors.gray[600]} />
          <Text style={styles.totalTimeText}>
            Total Time: {(recipe.prepTime || 0) + (recipe.cookTime || 0)}{" "}
            minutes
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...createShadow(2, 0.1, 8),
  },
  cardTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: spacing.md,
  },
  fieldContainer: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600",
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  charCount: {
    fontSize: typography.fontSizes.xs,
    color: colors.gray[400],
    fontWeight: "400",
  },
  charCountError: {
    color: colors.red[500],
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSizes.md,
    color: colors.dark,
    backgroundColor: colors.white,
    minHeight: 48,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSizes.md,
    color: colors.dark,
    backgroundColor: colors.white,
    minHeight: 80,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSizes.md,
    color: colors.dark,
    backgroundColor: colors.white,
    textAlign: "center",
    minHeight: 48,
  },
  textInputError: {
    borderColor: colors.red[500],
    borderWidth: 2,
  },
  errorText: {
    fontSize: typography.fontSizes.xs,
    color: colors.red[500],
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: spacing.md,
  },
  totalTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[50],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  totalTimeText: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[600],
    marginLeft: spacing.xs,
    fontWeight: "500",
  },
});

export default BasicInfoCard;
