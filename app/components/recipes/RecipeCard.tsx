import React from "react";
import { Recipe } from "../../types";
import { View, Text, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../utils/styleUtils";

interface RecipeCardProps {
  recipe: Recipe;
  onPress?: () => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onPress }) => {
  // Compute total cooking time
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const tags = recipe.tags || [];
  const maxTagsToShow = 2;
  const visibleTags = tags.slice(0, maxTagsToShow);
  const extraTagCount = tags.length - maxTagsToShow;

  // Debug to check recipe data
  console.log(
    "RecipeCard rendering recipe:",
    recipe.id,
    "title:",
    recipe.title
  );

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri:
              recipe.imageUrl ||
              "https://via.placeholder.com/400x300/EAEAEA/999999?text=No+Image",
          }}
          style={styles.image}
        />
        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={16} color="#fff" />
          <Text style={styles.timeText}>{totalTime} min</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {recipe.title || recipe.name || "Untitled Recipe"}
        </Text>
        <View style={styles.tagsRow}>
          {visibleTags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {extraTagCount > 0 && (
            <View style={styles.moreTag}>
              <Text style={styles.moreTagText}>+{extraTagCount} more</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.13,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 8,
    flex: 1,
  },
  imageContainer: {
    width: "100%",
    height: 140,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  timeContainer: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.7)",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
  },
  timeText: {
    color: "#fff",
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 10,
    color: colors.dark,
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    marginTop: 2,
    gap: 8,
  },
  tag: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 8,
  },
  tagText: {
    fontSize: 13,
    color: colors.gray[700],
    fontWeight: "500",
  },
  moreTag: {
    backgroundColor: colors.gray[200],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  moreTagText: {
    fontSize: 13,
    color: colors.gray[600],
    fontWeight: "500",
  },
});
