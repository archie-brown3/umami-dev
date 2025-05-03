import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { RecipeWithDetails } from "../../types/recipe";
import { recipeService } from "../../services/recipeService";

export default function RecipeDetail() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null);

  useEffect(() => {
    const loadRecipe = async () => {
      try {
        const recipeData = await recipeService.getRecipeById(id as string);
        setRecipe(recipeData);
      } catch (error) {
        console.error("Error loading recipe:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRecipe();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8AB39F" />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Recipe not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        {recipe.image_url ? (
          <Image source={{ uri: recipe.image_url }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={50} color="#CCC" />
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{recipe.title}</Text>
          {recipe.is_favorite && (
            <Ionicons name="heart" size={24} color="#E57373" />
          )}
        </View>

        <View style={styles.timeInfo}>
          <View style={styles.timeDetail}>
            <Ionicons name="time-outline" size={20} color="#666" />
            <Text style={styles.timeText}>Prep: {recipe.prep_time} min</Text>
          </View>
          <View style={styles.timeDetail}>
            <Ionicons name="flame-outline" size={20} color="#666" />
            <Text style={styles.timeText}>Cook: {recipe.cook_time} min</Text>
          </View>
          <View style={styles.timeDetail}>
            <Ionicons name="restaurant-outline" size={20} color="#666" />
            <Text style={styles.timeText}>
              Total: {recipe.prep_time + recipe.cook_time} min
            </Text>
          </View>
        </View>

        {recipe.description && (
          <View style={styles.section}>
            <Text style={styles.description}>{recipe.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients</Text>
          {recipe.recipe_ingredients?.map((item, index) => (
            <View key={item.id} style={styles.listItem}>
              <View style={styles.bullet} />
              <Text style={styles.listItemText}>
                {item.quantity} {item.unit} {item.ingredient.name}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          {recipe.recipe_steps?.map((step, index) => (
            <View key={step.id} style={styles.listItem}>
              <Text style={styles.listNumber}>{step.step_number}.</Text>
              <Text style={styles.listItemText}>{step.instruction}</Text>
            </View>
          ))}
        </View>

        {recipe.recipe_tags && recipe.recipe_tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagContainer}>
              {recipe.recipe_tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag.tag.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#E57373",
  },
  imageContainer: {
    width: "100%",
    height: 250,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  timeInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
  },
  timeDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    marginLeft: 5,
    color: "#666",
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: "#555",
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 10,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#8AB39F",
    marginTop: 8,
    marginRight: 10,
  },
  listNumber: {
    fontWeight: "bold",
    marginRight: 10,
    color: "#8AB39F",
    fontSize: 16,
  },
  listItemText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    lineHeight: 24,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  tag: {
    backgroundColor: "#8AB39F20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: "#8AB39F",
    fontSize: 14,
  },
});
