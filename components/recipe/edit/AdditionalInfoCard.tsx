import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
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

const CATEGORIES = [
  "Appetizer",
  "Main Course",
  "Side Dish",
  "Dessert",
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Beverage",
  "Soup",
  "Salad",
  "Sauce",
];

const CUISINES = [
  "American",
  "Italian",
  "Mexican",
  "Chinese",
  "Japanese",
  "Indian",
  "French",
  "Thai",
  "Mediterranean",
  "Greek",
  "Spanish",
  "Korean",
  "Vietnamese",
  "Middle Eastern",
  "German",
  "British",
  "Other",
];

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
  const [showCategories, setShowCategories] = useState(false);
  const [showCuisines, setShowCuisines] = useState(false);

  const renderDropdown = (
    items: string[],
    selectedValue: string,
    onSelect: (value: string) => void,
    placeholder: string,
    isVisible: boolean,
    onToggle: () => void
  ) => (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity style={styles.dropdownButton} onPress={onToggle}>
        <Text
          style={[
            styles.dropdownText,
            !selectedValue && styles.placeholderText,
          ]}
        >
          {selectedValue || placeholder}
        </Text>
        <Ionicons
          name={isVisible ? "chevron-up" : "chevron-down"}
          size={20}
          color={colors.gray[500]}
        />
      </TouchableOpacity>

      {isVisible && (
        <ScrollView style={styles.dropdownList} nestedScrollEnabled>
          {items.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.dropdownItem,
                selectedValue === item && styles.selectedItem,
              ]}
              onPress={() => {
                onSelect(item);
                onToggle();
              }}
            >
              <Text
                style={[
                  styles.dropdownItemText,
                  selectedValue === item && styles.selectedItemText,
                ]}
              >
                {item}
              </Text>
              {selectedValue === item && (
                <Ionicons name="checkmark" size={16} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Additional Information</Text>

      {/* Category Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Category</Text>
        {renderDropdown(
          CATEGORIES,
          recipe.category || "",
          (value) => onUpdate("category", value),
          "Select category",
          showCategories,
          () => setShowCategories(!showCategories)
        )}
        {errors.category && (
          <Text style={styles.errorText}>{errors.category}</Text>
        )}
      </View>

      {/* Cuisine Selection */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Cuisine</Text>
        {renderDropdown(
          CUISINES,
          recipe.cuisine || "",
          (value) => onUpdate("cuisine", value),
          "Select cuisine",
          showCuisines,
          () => setShowCuisines(!showCuisines)
        )}
        {errors.cuisine && (
          <Text style={styles.errorText}>{errors.cuisine}</Text>
        )}
      </View>

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

      {/* Tags Section - Using new TagEditor component */}
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
  dropdownContainer: {
    position: "relative",
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    minHeight: 48,
  },
  dropdownText: {
    fontSize: typography.fontSizes.md,
    color: colors.dark,
  },
  placeholderText: {
    color: colors.gray[500],
  },
  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderTopWidth: 0,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    maxHeight: 200,
    zIndex: 1001,
    ...createShadow(4, 0.15, 8),
  },
  dropdownItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  selectedItem: {
    backgroundColor: colors.primary + "10",
  },
  dropdownItemText: {
    fontSize: typography.fontSizes.md,
    color: colors.dark,
  },
  selectedItemText: {
    color: colors.primary,
    fontWeight: "600",
  },
  difficultyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    marginHorizontal: spacing.xs,
  },
  selectedDifficulty: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  difficultyText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600",
    marginLeft: spacing.xs,
    color: colors.gray[700],
  },
  selectedDifficultyText: {
    color: colors.white,
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.red[500],
    marginTop: spacing.xs,
  },
  tipsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.blue[50],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  tipsText: {
    fontSize: typography.fontSizes.xs,
    color: colors.gray[600],
    marginLeft: spacing.xs,
    flex: 1,
    lineHeight: 16,
  },
});

export default AdditionalInfoCard;
