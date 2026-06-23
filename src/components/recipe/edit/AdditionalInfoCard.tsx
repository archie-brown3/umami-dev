import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Recipe } from "@/types";
import { ValidationErrors, VALIDATION_LIMITS } from "@/utils/recipeValidation";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  createShadow,
} from "@/utils/styleUtils";
import TagEditor from "@/components/recipes/TagEditor";

interface AdditionalInfoCardProps {
  recipe: Recipe;
  onUpdate: <K extends keyof Recipe>(field: K, value: Recipe[K]) => void;
  errors: ValidationErrors;
}

// Simplified categories - removed to streamline editing
const DIFFICULTIES = [
  { value: "Easy", label: "Easy", icon: "star", color: colors.green[500] },
  {
    value: "Medium",
    label: "Medium",
    icon: "star-half",
    color: colors.orange[500],
  },
  {
    value: "Hard",
    label: "Hard",
    icon: "star-outline",
    color: colors.red[500],
  },
];

const AdditionalInfoCard: React.FC<AdditionalInfoCardProps> = ({
  recipe,
  onUpdate,
  errors,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Additional Information</Text>

      {/* Difficulty Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Difficulty Level</Text>
        <View style={styles.difficultyContainer}>
          {DIFFICULTIES.map((difficulty) => (
            <TouchableOpacity
              key={difficulty.value}
              style={[
                styles.difficultyButton,
                recipe.difficulty === difficulty.value &&
                  styles.selectedDifficulty,
              ]}
              onPress={() =>
                onUpdate("difficulty", difficulty.value as Recipe["difficulty"])
              }
            >
              <Ionicons
                name={difficulty.icon as any}
                size={20}
                color={
                  recipe.difficulty === difficulty.value
                    ? colors.white
                    : difficulty.color
                }
              />
              <Text
                style={[
                  styles.difficultyText,
                  recipe.difficulty === difficulty.value &&
                    styles.selectedDifficultyText,
                ]}
              >
                {difficulty.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.difficulty && (
          <Text style={styles.errorText}>{errors.difficulty}</Text>
        )}
      </View>

      {/* Tags Section - Using TagEditor component */}
      <View style={styles.fieldContainer}>
        <TagEditor
          tags={recipe.tags || []}
          onTagsChange={(tags) => onUpdate("tags", tags)}
          placeholder="Add a tag..."
          maxTags={VALIDATION_LIMITS.TAGS.max}
        />
        {errors.tags && <Text style={styles.errorText}>{errors.tags}</Text>}
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Ionicons name="bulb-outline" size={16} color={colors.gray[500]} />
        <Text style={styles.tipsText}>
          Tags help others discover your recipe. Use descriptive words like
          "vegetarian", "quick", "comfort food", etc.
        </Text>
      </View>
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
  difficultyContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  difficultyButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    gap: spacing.xs,
  },
  selectedDifficulty: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  difficultyText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600",
    color: colors.gray[700],
  },
  selectedDifficultyText: {
    color: colors.white,
  },
  tipsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tipsText: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.gray[600],
    lineHeight: 20,
  },
  errorText: {
    color: colors.red[500],
    fontSize: typography.fontSizes.sm,
    marginTop: spacing.xs,
  },
});

export default AdditionalInfoCard;
