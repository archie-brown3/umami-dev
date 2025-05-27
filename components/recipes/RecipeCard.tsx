import React from "react";
import { Recipe } from "../../types";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "../../utils/styleUtils";
import { formatTagName, getTagCategoryColor } from "../../services/tagUtils";
import { useImageLoading } from "../../hooks/useImageLoading";

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
  onTagPress?: (tag: string) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onPress,
  onTagPress,
}) => {
  // Use the new image loading hook to handle all image loading logic
  const {
    currentImageUrl,
    imageError,
    handleImageError,
    handleImageLoad,
    getImageSource,
  } = useImageLoading(recipe.imageUrl, {
    componentName: "RecipeCard",
    placeholderWidth: 400,
    placeholderHeight: 300,
    enableFallbacks: true,
  });

  // Compute total cooking time
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const tags = recipe.tags || [];
  const maxTagsToShow = 3;
  const visibleTags = tags.slice(0, maxTagsToShow);
  const extraTagCount = tags.length - maxTagsToShow;

  // Debug to check recipe data (only log once per recipe)
  console.log(
    "RecipeCard rendering recipe:",
    recipe.id,
    "title:",
    recipe.title,
    "tags:",
    tags
  );

  const handleTagPress = (tag: string, event: any) => {
    event.stopPropagation(); // Prevent card press
    onTagPress?.(tag);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={getImageSource()}
          style={styles.image}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        {totalTime > 0 && (
          <View style={styles.timeContainer}>
            <Ionicons name="time-outline" size={14} color="#fff" />
            <Text style={styles.timeText}>{totalTime} min</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {recipe.title || recipe.name || "Untitled Recipe"}
        </Text>

        {/* Recipe metadata */}
        <View style={styles.metaContainer}>
          <View style={styles.metaRow}>
            <Ionicons
              name="restaurant-outline"
              size={12}
              color={colors.gray[500]}
            />
            <Text style={styles.metaText}>
              {recipe.servings || 1} serving{recipe.servings === 1 ? "" : "s"}
            </Text>
          </View>
          {recipe.difficulty && (
            <View style={styles.metaRow}>
              <Ionicons
                name="star-outline"
                size={12}
                color={colors.gray[500]}
              />
              <Text style={styles.metaText}>{recipe.difficulty}</Text>
            </View>
          )}
        </View>

        {/* Tags section - only show if tags exist */}
        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <View style={styles.tagsRow}>
              {visibleTags.map((tag, index) => {
                const categoryColor = getTagCategoryColor(tag);
                return (
                  <TouchableOpacity
                    key={`${tag}-${index}`}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: categoryColor + "20",
                        borderColor: categoryColor + "40",
                      },
                    ]}
                    onPress={(event) => handleTagPress(tag, event)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tagText, { color: categoryColor }]}>
                      {formatTagName(tag)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {extraTagCount > 0 && (
                <TouchableOpacity
                  style={styles.moreTag}
                  onPress={(event) => {
                    event.stopPropagation();
                    onTagPress?.("show_all");
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moreTagText}>+{extraTagCount}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.gray[100],
    marginBottom: spacing.md,
    flex: 1,
    minHeight: 220,
  },
  imageContainer: {
    width: "100%",
    height: 120,
    position: "relative",
    backgroundColor: colors.gray[50],
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  timeContainer: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.75)",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.full,
  },
  timeText: {
    color: "#fff",
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    padding: spacing.md,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.sm,
    color: colors.dark,
    lineHeight: 20,
  },
  metaContainer: {
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  metaText: {
    fontSize: 12,
    color: colors.gray[600],
    marginLeft: 4,
    fontWeight: "500",
  },
  tagsContainer: {
    marginTop: spacing.xs,
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  moreTag: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 4,
  },
  moreTagText: {
    fontSize: 11,
    color: colors.gray[600],
    fontWeight: "600",
  },
});
