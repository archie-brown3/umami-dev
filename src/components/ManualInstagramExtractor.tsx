import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { extractRecipeFromInstagramCaption } from "../services/recipeExtractor";
import { Recipe } from "../types";

interface ManualInstagramExtractorProps {
  onRecipeExtracted: (recipe: Partial<Recipe>) => void;
  onCancel: () => void;
  initialUrl?: string;
}

export default function ManualInstagramExtractor({
  onRecipeExtracted,
  onCancel,
  initialUrl = "",
}: ManualInstagramExtractorProps) {
  const [instagramUrl, setInstagramUrl] = useState(initialUrl);
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const extractUsernameAndPostId = (url: string) => {
    const match = url.match(/instagram\.com\/p\/([^\/]+)/);
    const usernameMatch = url.match(/instagram\.com\/([^\/]+)/);

    return {
      postId: match ? match[1] : "",
      username: usernameMatch ? usernameMatch[1] : "unknown",
    };
  };

  const handleExtract = async () => {
    if (!caption.trim()) {
      Alert.alert(
        "Missing Caption",
        "Please paste the Instagram caption to extract the recipe."
      );
      return;
    }

    if (!instagramUrl.trim()) {
      Alert.alert("Missing URL", "Please provide the Instagram post URL.");
      return;
    }

    try {
      setLoading(true);

      const { username } = extractUsernameAndPostId(instagramUrl);

      const recipe = await extractRecipeFromInstagramCaption(
        caption,
        username,
        instagramUrl,
        imageUrl || undefined
      );

      onRecipeExtracted(recipe);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      Alert.alert("Extraction Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasteExample = () => {
    setCaption(`🍝 CREAMY GARLIC PASTA 🍝

Ingredients:
• 400g pasta (any shape)
• 4 cloves garlic, minced
• 1 cup heavy cream
• 1/2 cup parmesan cheese
• 2 tbsp olive oil
• Salt and pepper to taste
• Fresh parsley for garnish

Instructions:
1. Cook pasta according to package directions
2. Heat olive oil in a large pan
3. Add garlic and cook for 1 minute
4. Pour in cream and bring to a simmer
5. Add cooked pasta and toss
6. Stir in parmesan cheese
7. Season with salt and pepper
8. Garnish with fresh parsley

Serves 4 • Prep: 5 min • Cook: 15 min

#pasta #recipe #cooking #foodie`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.title}>Manual Instagram Extraction</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 Instagram Post URL</Text>
        <TextInput
          style={styles.urlInput}
          value={instagramUrl}
          onChangeText={setInstagramUrl}
          placeholder="https://www.instagram.com/p/..."
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📝 Instagram Caption</Text>
          <TouchableOpacity
            onPress={handlePasteExample}
            style={styles.exampleButton}
          >
            <Text style={styles.exampleButtonText}>Try Example</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.captionInput}
          value={caption}
          onChangeText={setCaption}
          placeholder="Paste the Instagram caption here..."
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
        />
        <Text style={styles.hint}>
          💡 Copy the entire caption from Instagram, including ingredients and
          instructions
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🖼️ Image URL (Optional)</Text>
        <TextInput
          style={styles.urlInput}
          value={imageUrl}
          onChangeText={setImageUrl}
          placeholder="https://example.com/image.jpg"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={styles.hint}>
          If you have a direct link to the recipe image, paste it here
        </Text>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>📋 How to use:</Text>
        <Text style={styles.instructionText}>1. Go to the Instagram post</Text>
        <Text style={styles.instructionText}>2. Copy the entire caption</Text>
        <Text style={styles.instructionText}>
          3. Paste it in the caption field above
        </Text>
        <Text style={styles.instructionText}>
          4. Our AI will extract the recipe details
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.extractButton, loading && styles.extractButtonDisabled]}
        onPress={handleExtract}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="restaurant" size={20} color="#fff" />
            <Text style={styles.extractButtonText}>Extract Recipe</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  cancelButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  section: {
    backgroundColor: "#fff",
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  exampleButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  exampleButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  urlInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
  },
  captionInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f8f9fa",
    minHeight: 150,
  },
  hint: {
    fontSize: 12,
    color: "#666",
    marginTop: 8,
    fontStyle: "italic",
  },
  instructions: {
    backgroundColor: "#e3f2fd",
    margin: 15,
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 14,
    color: "#1976D2",
    marginBottom: 5,
  },
  extractButton: {
    backgroundColor: "#28a745",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    margin: 15,
    borderRadius: 12,
    gap: 8,
  },
  extractButtonDisabled: {
    backgroundColor: "#6c757d",
  },
  extractButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
