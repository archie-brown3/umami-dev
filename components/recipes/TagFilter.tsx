import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { colors } from "@/utils/styleUtils";
import { Recipe } from "@/types";
import {
  processRecipeTags,
  formatTagName,
  getTagCategoryColor,
  ProcessedTags,
} from "@/services/tagUtils";

interface TagFilterProps {
  recipes: Recipe[];
  onFilterChange: (filteredRecipes: Recipe[]) => void;
  selectedTags: string[];
  onTagSelectionChange: (tags: string[]) => void;
}

export const TagFilter: React.FC<TagFilterProps> = ({
  recipes,
  onFilterChange,
  selectedTags,
  onTagSelectionChange,
}) => {
  const [processedTags, setProcessedTags] = useState<ProcessedTags>({
    categories: [],
    allTags: [],
  });
  const [showCategories, setShowCategories] = useState(false);

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
      const recipeTags = (recipe.tags || []).map((tag) => tag.toLowerCase());
      return selectedTags.every((selectedTag) =>
        recipeTags.includes(selectedTag.toLowerCase())
      );
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
        {/* Clear filters button (only show if tags are selected) */}
        {selectedTags.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => onTagSelectionChange([])}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}

        {/* Category toggle button */}
        <TouchableOpacity
          style={[
            styles.categoryToggle,
            showCategories && styles.categoryToggleActive,
          ]}
          onPress={() => setShowCategories(!showCategories)}
        >
          <Text
            style={[
              styles.categoryToggleText,
              showCategories && styles.categoryToggleTextActive,
            ]}
          >
            {showCategories ? "📂 Categories" : "📋 All Tags"}
          </Text>
        </TouchableOpacity>

        {/* Render tags based on view mode */}
        {showCategories
          ? // Categorized view
            processedTags.categories.map((category) => (
              <View key={category.name} style={styles.categorySection}>
                <Text style={styles.categoryLabel}>
                  {category.icon} {category.name}
                </Text>
                <View style={styles.categoryTags}>
                  {category.tags.slice(0, 3).map(({ tag, count }) => {
                    const selected = isTagSelected(tag);
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
            ))
          : // All tags view (simplified, most frequent first)
            processedTags.allTags.slice(0, 12).map(({ tag, count }) => {
              const selected = isTagSelected(tag);
              const categoryColor = getTagCategoryColor(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagPill,
                    selected && styles.selectedTagPill,
                    { borderColor: categoryColor },
                    selected && { backgroundColor: categoryColor },
                  ]}
                  onPress={() => handleTagPress(tag)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[styles.tagText, selected && styles.selectedTagText]}
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
    paddingBottom: 8,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  clearButton: {
    backgroundColor: colors.red[500],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  clearButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  tagPill: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    flexDirection: "row",
    alignItems: "center",
  },
  selectedTagPill: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[600],
  },
  tagText: {
    color: colors.gray[700],
    fontSize: 14,
    fontWeight: "500",
    marginRight: 4,
  },
  selectedTagText: {
    color: colors.white,
    fontWeight: "600",
  },
  tagCount: {
    color: colors.gray[500],
    fontSize: 12,
    fontWeight: "400",
    backgroundColor: colors.gray[200],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  selectedTagCount: {
    color: colors.primary[500],
    backgroundColor: colors.white,
  },
  selectionInfo: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  selectionText: {
    fontSize: 12,
    color: colors.gray[600],
    fontStyle: "italic",
  },
  categoryToggle: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryToggleActive: {
    backgroundColor: colors.primary[500],
  },
  categoryToggleText: {
    color: colors.gray[700],
    fontSize: 14,
    fontWeight: "500",
  },
  categoryToggleTextActive: {
    color: colors.white,
    fontWeight: "600",
  },
  categorySection: {
    marginRight: 16,
  },
  categoryLabel: {
    color: colors.gray[700],
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  categoryTags: {
    flexDirection: "row",
    alignItems: "center",
  },
});
