import React from "react";
import { Recipe } from "../../../types";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "../../../utils/styleUtils";
import { formatTagName } from "../../../services/tagUtils";
import { useImageLoading } from "../../../hooks/useImageLoading";

interface CompactRecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
  onDelete?: () => void;
  showDeleteButton?: boolean;
}

export const CompactRecipeCard: React.FC<CompactRecipeCardProps> = ({
  recipe,
  onPress,
  onDelete,
  showDeleteButton = true,
}) => {
  // Use the new image loading hook to handle all image loading logic
  const {
    currentImageUrl,
    imageError,
    handleImageError,
    handleImageLoad,
    getImageSource,
  } = useImageLoading(recipe.imageUrl, {
    componentName: "CompactRecipeCard",
    placeholderWidth: 140,
    placeholderHeight: 80,
    enableFallbacks: true,
  });

  // Compute total cooking time
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const tags = recipe.tags || [];
  const maxTagsToShow = 1; // Show fewer tags due to compact size
  const visibleTags = tags.slice(0, maxTagsToShow);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image
          source={getImageSource()}
          style={styles.image}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />

        {/* Time badge */}
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={12} color="#fff" />
          <Text style={styles.timeText}>{totalTime}m</Text>
        </View>

        {/* Delete button */}
        {showDeleteButton && onDelete && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={onDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {recipe.title || recipe.name || "Untitled Recipe"}
        </Text>

        {/* Single tag if available */}
        {visibleTags.length > 0 && (
          <View style={styles.tagContainer}>
            <Text style={styles.tagText}>{formatTagName(visibleTags[0])}</Text>
            {tags.length > 1 && (
              <Text style={styles.moreTagsText}>+{tags.length - 1}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    width: 140, // Compact width
    marginRight: spacing.sm,
  },
  imageContainer: {
    width: "100%",
    height: 80, // Much smaller than original 140px
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  timeContainer: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.7)",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  timeText: {
    color: "#fff",
    marginLeft: 2,
    fontSize: 11,
    fontWeight: "600",
  },
  deleteButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: spacing.sm,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: spacing.xs,
    color: colors.dark,
    lineHeight: 16,
  },
  tagContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  tagText: {
    fontSize: 10,
    color: colors.gray[600],
    fontWeight: "500",
    backgroundColor: colors.gray[100],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  moreTagsText: {
    fontSize: 10,
    color: colors.gray[500],
    marginLeft: spacing.xs,
  },
});

export default CompactRecipeCard;
