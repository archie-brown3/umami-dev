import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { colors, spacing, borderRadius } from "../../utils/styleUtils";
import { Recipe } from "../../types";
import {
  processRecipeTags,
  formatTagName,
  getTagCategoryColor,
  getCuisineFlag,
  ProcessedTags,
} from "../../services/tagUtils";

interface CategorizedTagFilterProps {
  recipes: Recipe[];
  onFilterChange: (filteredRecipes: Recipe[]) => void;
  selectedTags: string[];
  onTagSelectionChange: (tags: string[]) => void;
}

const CategorizedTagFilter: React.FC<CategorizedTagFilterProps> = ({
  recipes,
  onFilterChange,
  selectedTags,
  onTagSelectionChange,
}) => {
  const [processedTags, setProcessedTags] = useState<ProcessedTags>({
    categories: [],
    allTags: [],
  });

  // Extract and process all tags from recipes
  useEffect(() => {
    console.log("[TagFilter] Processing tags for recipes:", recipes.length);
    const processed = processRecipeTags(recipes);
    console.log("[TagFilter] Processed tags:", processed);
    setProcessedTags(processed);
  }, [recipes]);

  // Filter recipes based on selected tags (intersection - must have ALL selected tags)
  useEffect(() => {
    if (selectedTags.length === 0) {
      onFilterChange(recipes);
      return;
    }

    const filteredRecipes = recipes.filter((recipe) => {
      const recipeTags = (recipe.tags || []).map((tag) =>
        tag.toLowerCase().trim()
      );
      const normalizedSelectedTags = selectedTags.map((tag) =>
        tag.toLowerCase().trim()
      );

      const hasAllTags = normalizedSelectedTags.every((selectedTag) =>
        recipeTags.includes(selectedTag)
      );

      return hasAllTags;
    });

    onFilterChange(filteredRecipes);
  }, [selectedTags, recipes, onFilterChange]);

  const handleTagPress = (tag: string) => {
    const normalizedTag = tag.toLowerCase();
    const newSelectedTags = selectedTags.includes(normalizedTag)
      ? selectedTags.filter((t) => t !== normalizedTag)
      : [...selectedTags, normalizedTag];

    onTagSelectionChange(newSelectedTags);
  };

  const isTagSelected = (tag: string) => {
    return selectedTags.includes(tag.toLowerCase());
  };

  if (processedTags.allTags.length === 0) {
    return null; // Don't render if no tags available
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Categorized view only */}
        {processedTags.categories.map((category) => (
          <View key={category.name} style={styles.categorySection}>
            <Text style={styles.categoryLabel}>
              <Text style={styles.categoryIcon}>{category.icon}</Text>{" "}
              {category.name}
            </Text>
            <View style={styles.categoryTags}>
              {category.tags.slice(0, 3).map(({ tag, count }) => {
                const selected = isTagSelected(tag);
                const isCuisine = category.name === "Cuisine";
                const flag = isCuisine ? getCuisineFlag(tag) : "";

                return (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.tagPill,
                      selected && styles.selectedTagPill,
                      { borderColor: category.color },
                      selected && { backgroundColor: category.color },
                    ]}
                    onPress={() => handleTagPress(tag)}
                    activeOpacity={0.7}
                  >
                    {flag && <Text style={styles.flagIcon}>{flag}</Text>}
                    <Text
                      style={[
                        styles.tagText,
                        selected && styles.selectedTagText,
                      ]}
                    >
                      {formatTagName(tag)}
                    </Text>
                    <Text
                      style={[
                        styles.tagCount,
                        selected && styles.selectedTagCount,
                      ]}
                    >
                      {count}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Clear filters button (inline with tags, only show if tags are selected) */}
        {selectedTags.length > 0 && (
          <View style={styles.clearButtonContainer}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => onTagSelectionChange([])}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Selection info */}
      {selectedTags.length > 0 && (
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionText}>
            Showing recipes with: {selectedTags.map(formatTagName).join(", ")}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
  },
  scrollContainer: {
    paddingVertical: spacing.xs,
  },
  categorySection: {
    marginRight: spacing.lg,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  categoryIcon: {
    fontSize: 14,
  },
  categoryTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 100,
    borderWidth: 1,
    backgroundColor: colors.white,
    gap: spacing.xs,
  },
  selectedTagPill: {
    borderWidth: 0,
  },
  tagText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  selectedTagText: {
    color: colors.white,
  },
  tagCount: {
    fontSize: 12,
    color: colors.gray[500],
  },
  selectedTagCount: {
    color: colors.white,
  },
  flagIcon: {
    fontSize: 14,
    marginRight: spacing.xs,
  },
  clearButtonContainer: {
    justifyContent: "center",
    paddingLeft: spacing.sm,
  },
  clearButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 100,
    backgroundColor: colors.gray[100],
  },
  clearButtonText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  selectionInfo: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  selectionText: {
    fontSize: 12,
    color: colors.gray[600],
  },
});

export default CategorizedTagFilter;
