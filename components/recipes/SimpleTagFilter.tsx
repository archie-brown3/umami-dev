import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "../../utils/styleUtils";
import { Recipe } from "../../types";

interface SimpleTagFilterProps {
  recipes: Recipe[];
  onFilterChange: (filteredRecipes: Recipe[]) => void;
  selectedTags: string[];
  onTagSelectionChange: (tags: string[]) => void;
}

const SimpleTagFilter: React.FC<SimpleTagFilterProps> = ({
  recipes,
  onFilterChange,
  selectedTags,
  onTagSelectionChange,
}) => {
  const [allTags, setAllTags] = useState<{ tag: string; count: number }[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);

  // Extract and count all tags from recipes
  useEffect(() => {
    const tagCounts = new Map<string, number>();

    recipes.forEach((recipe) => {
      const recipeTags = recipe.tags || [];
      recipeTags.forEach((tag) => {
        if (tag && tag.trim()) {
          const normalizedTag = tag.trim().toLowerCase();
          tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + 1);
        }
      });
    });

    // Convert to array and sort by frequency
    const sortedTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);

    setAllTags(sortedTags);
  }, [recipes]);

  // Filter recipes based on selected tags
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

  const clearAllTags = () => {
    onTagSelectionChange([]);
  };

  // Show top 10 tags by default, or all if showAllTags is true
  const tagsToShow = showAllTags ? allTags : allTags.slice(0, 10);

  if (allTags.length === 0) {
    return null; // Don't render if no tags available
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filter by Tags</Text>
        {selectedTags.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearAllTags}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {selectedTags.length > 0 && (
        <View style={styles.selectedTagsContainer}>
          <Text style={styles.selectedLabel}>
            Selected ({selectedTags.length}):
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.selectedTagsScroll}
          >
            {selectedTags.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={styles.selectedTag}
                onPress={() => handleTagPress(tag)}
              >
                <Text style={styles.selectedTagText}>{tag}</Text>
                <Ionicons name="close" size={14} color={colors.white} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tagsScroll}
        contentContainerStyle={styles.tagsContent}
      >
        {tagsToShow.map(({ tag, count }, index) => {
          const selected = isTagSelected(tag);
          return (
            <TouchableOpacity
              key={index}
              style={[styles.tagChip, selected && styles.tagChipSelected]}
              onPress={() => handleTagPress(tag)}
            >
              <Text
                style={[styles.tagText, selected && styles.tagTextSelected]}
              >
                {tag}
              </Text>
              <Text
                style={[styles.tagCount, selected && styles.tagCountSelected]}
              >
                {count}
              </Text>
            </TouchableOpacity>
          );
        })}

        {allTags.length > 10 && (
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => setShowAllTags(!showAllTags)}
          >
            <Text style={styles.showMoreText}>
              {showAllTags ? "Show Less" : `+${allTags.length - 10} more`}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
  },
  clearButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[100],
  },
  clearText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  selectedTagsContainer: {
    marginBottom: spacing.sm,
  },
  selectedLabel: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  selectedTagsScroll: {
    marginBottom: spacing.xs,
  },
  selectedTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
  },
  selectedTagText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: "500",
    marginRight: spacing.xs,
  },
  tagsScroll: {
    marginTop: spacing.xs,
  },
  tagsContent: {
    paddingRight: spacing.md,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  tagChipSelected: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[300],
  },
  tagText: {
    fontSize: 14,
    color: colors.gray[700],
    fontWeight: "500",
    marginRight: spacing.xs,
  },
  tagTextSelected: {
    color: colors.primary[700],
  },
  tagCount: {
    fontSize: 12,
    color: colors.gray[500],
    backgroundColor: colors.gray[200],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: "center",
  },
  tagCountSelected: {
    color: colors.primary[600],
    backgroundColor: colors.primary[200],
  },
  showMoreButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderStyle: "dashed",
  },
  showMoreText: {
    fontSize: 14,
    color: colors.gray[600],
    fontStyle: "italic",
  },
});

export default SimpleTagFilter;
