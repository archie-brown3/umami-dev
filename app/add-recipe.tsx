import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../utils/styleUtils";
import { useRecipes } from "../context/RecipeContext";
import { Recipe, Ingredient } from "../types/app";
import { scrapeFromUrl, analyzeRecipeText } from "../services/deepseekservice";
import { extractRecipeFromUrl } from "../services/recipeExtractor";

type TabType = "manual" | "url" | "ai" | "instagram";

export default function AddRecipeScreen() {
  const params = useLocalSearchParams();
  const { addRecipe } = useRecipes();

  // Get the active tab from URL params or default to manual
  const initialTab = (params?.tab as TabType) || "manual";
  const previousScreen = (params?.previousScreen as string) || "/recipes";
  const isModal = params?.presentationStyle === "modal";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Form state for manual input
  const [title, setTitle] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");

  // States for URL and Instagram
  const [urlInput, setUrlInput] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Add a debug log entry
  const addLog = (message: string) => {
    console.log(`[Debug] ${message}`);
    setDebugLogs((prev) => [
      ...prev,
      `[${new Date().toISOString()}] ${message}`,
    ]);
  };

  // Handle close/back button - go to previous screen
  const handleClose = () => {
    if (isModal) {
      // If presented as modal, simply go back
      router.back();
    } else {
      // Otherwise navigate to previous screen
      router.push(previousScreen as any);
    }
  };

  // Extract recipe from URL
  const handleUrlExtraction = async () => {
    if (!urlInput.trim()) {
      Alert.alert("Error", "Please enter a valid URL");
      return;
    }

    try {
      setIsLoading(true);
      addLog(`Extracting content from ${urlInput}...`);

      // Step 1: Scrape content from the URL
      const scrapedContent = await scrapeFromUrl(urlInput);

      if (!scrapedContent || !scrapedContent.caption) {
        const errorMsg = "Couldn't extract content from this URL";
        addLog(errorMsg);
        Alert.alert(
          "Error",
          `${errorMsg}. Please try another one or add the recipe manually.`
        );
        setIsLoading(false);
        return;
      }

      addLog(
        `Content extracted successfully (${scrapedContent.caption.length} chars)`
      );

      // Step 2: Analyze the recipe text to structure it
      addLog("Analyzing recipe text with DeepSeek...");
      const recipeData = await analyzeRecipeText(scrapedContent.caption);

      if (recipeData) {
        addLog("Recipe analysis successful");
        // Step 3: Create a valid Recipe object from the analyzed data
        const newRecipe: Recipe = {
          id: Date.now().toString(),
          name: recipeData.name || "Untitled Recipe",
          description: recipeData.description,
          ingredients: recipeData.ingredients || [],
          instructions: recipeData.instructions || [],
          prepTime: recipeData.prepTime || 0,
          cookTime: recipeData.cookTime || 0,
          servings: recipeData.servings || 2,
          imageUrl: scrapedContent.imageUrl,
          tags: recipeData.tags,
        };

        // Step 4: Add the recipe to the user's collection
        addRecipe(newRecipe);
        addLog(`Recipe added: ${newRecipe.name}`);

        // Step 5: Return to the previous screen with success message
        Alert.alert(
          "Success",
          `Recipe "${newRecipe.name}" has been successfully added to your collection.`,
          [
            {
              text: "OK",
              onPress: navigateAfterSuccess,
            },
          ]
        );
      } else {
        const errorMsg = "Failed to analyze the recipe text";
        addLog(errorMsg);
        Alert.alert("Error", `${errorMsg}. Please try again or add manually.`);
      }
    } catch (error) {
      console.error("URL extraction error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addLog(`Error: ${errorMessage}`);
      Alert.alert("Error", `Failed to extract recipe: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract recipe from Instagram
  const handleInstagramExtraction = async () => {
    if (!instagramUrl.trim() || !instagramUrl.includes("instagram.com")) {
      Alert.alert("Error", "Please enter a valid Instagram URL");
      return;
    }

    try {
      setIsLoading(true);
      addLog(`Extracting recipe from ${instagramUrl}...`);

      // Step 1: Extract content from Instagram URL using the API service
      const extractedData = await extractRecipeFromUrl(instagramUrl);

      // Validate we've received proper data
      if (!extractedData) {
        Alert.alert(
          "Error",
          "Received empty response from extraction service."
        );
        setIsLoading(false);
        return;
      }

      addLog(
        `Extraction successful. Received: ${JSON.stringify(
          extractedData
        ).substring(0, 100)}...`
      );

      // Make sure we have at least ingredients or caption to work with
      if (
        !extractedData.ingredients?.length &&
        !extractedData.caption &&
        !extractedData.instructions?.length
      ) {
        Alert.alert(
          "Error",
          "Couldn't extract recipe information from this Instagram post. No ingredients or instructions found."
        );
        setIsLoading(false);
        return;
      }

      // Prepare the recipe text - using extracted ingredients and instructions if available
      let recipeText = "";

      if (extractedData.caption) {
        // If caption is available, use it
        recipeText = extractedData.caption;
        addLog(`Using caption text (${recipeText.length} chars)`);
      } else if (
        extractedData.ingredients &&
        extractedData.ingredients.length > 0
      ) {
        // Otherwise build a recipe text from the structured data
        addLog(
          `Building recipe text from ${
            extractedData.ingredients.length
          } ingredients and ${
            extractedData.instructions?.length || 0
          } instructions`
        );
        recipeText = `Recipe\n\nIngredients:\n`;
        extractedData.ingredients.forEach((ing: string) => {
          recipeText += `- ${ing}\n`;
        });

        if (
          extractedData.instructions &&
          extractedData.instructions.length > 0
        ) {
          recipeText += `\nInstructions:\n`;
          extractedData.instructions.forEach((step: string, index: number) => {
            recipeText += `${index + 1}. ${step}\n`;
          });
        }
      } else {
        Alert.alert(
          "Error",
          "Couldn't extract sufficient recipe information from this Instagram post."
        );
        setIsLoading(false);
        return;
      }

      // Step 2: Analyze the recipe text to structure it with DeepSeek
      addLog("Analyzing recipe text with DeepSeek...");
      const recipeData = await analyzeRecipeText(recipeText);

      if (recipeData) {
        addLog("Recipe analysis successful");
        // Step 3: Create a valid Recipe object with both the parsed data and images
        const newRecipe: Recipe = {
          id: Date.now().toString(),
          name: recipeData.name || "Untitled Recipe",
          description: recipeData.description,
          ingredients: recipeData.ingredients || [],
          instructions: recipeData.instructions || [],
          prepTime: recipeData.prepTime || 0,
          cookTime: recipeData.cookTime || 0,
          servings: recipeData.servings || 2,
          imageUrl: extractedData.media?.[0]?.url, // Use the first image from extraction
          tags: recipeData.tags,
        };

        // Step 4: Add the complete recipe to the user's collection
        addRecipe(newRecipe);
        addLog(`Recipe added: ${newRecipe.name}`);

        // Step 5: Return to the previous screen
        Alert.alert(
          "Success",
          `Recipe "${newRecipe.name}" has been successfully added to your collection.`,
          [
            {
              text: "OK",
              onPress: navigateAfterSuccess,
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to analyze the recipe. Please try again or add manually."
        );
      }
    } catch (error) {
      console.error("Instagram extraction error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addLog(`Error: ${errorMessage}`);
      Alert.alert("Error", `Failed to extract recipe: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a recipe manually
  const handleAddRecipe = () => {
    // Very basic validation
    if (!title) {
      alert("Please enter a title");
      return;
    }

    // Create a recipe object that matches Recipe type
    const newRecipe: Recipe = {
      id: Date.now().toString(),
      name: title,
      ingredients: [
        {
          id: "ing-1",
          name: "Example ingredient",
          amount: 1,
          unit: "item",
        },
      ],
      instructions: ["Example instruction"],
      prepTime: parseInt(prepTime) || 0,
      cookTime: parseInt(cookTime) || 0,
      servings: parseInt(servings) || 1,
    };

    // Add the recipe to context
    addRecipe(newRecipe);

    // Show success message and navigate to previous screen
    Alert.alert(
      "Success",
      `Recipe "${newRecipe.name}" has been successfully added to your collection.`,
      [
        {
          text: "OK",
          onPress: navigateAfterSuccess,
        },
      ]
    );
  };

  // Update the success alerts to use the correct navigation method
  const navigateAfterSuccess = () => {
    if (isModal) {
      router.back();
    } else {
      router.push(previousScreen as any);
    }
  };

  // Render a tab button
  const renderTabButton = (
    tab: TabType,
    label: string,
    icon: keyof typeof Ionicons.glyphMap
  ) => (
    <Pressable
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons
        name={icon}
        size={20}
        color={activeTab === tab ? colors.primary : colors.gray[500]}
      />
      <Text
        style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}
      >
        {label}
      </Text>
    </Pressable>
  );

  // Different content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "manual":
        return (
          <View style={styles.tabContent}>
            <Text style={styles.label}>Recipe Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter recipe title"
            />

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Prep Time (mins)</Text>
                <TextInput
                  style={styles.input}
                  value={prepTime}
                  onChangeText={setPrepTime}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.half}>
                <Text style={styles.label}>Cook Time (mins)</Text>
                <TextInput
                  style={styles.input}
                  value={cookTime}
                  onChangeText={setCookTime}
                  placeholder="0"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Text style={styles.label}>Servings</Text>
            <TextInput
              style={styles.input}
              value={servings}
              onChangeText={setServings}
              placeholder="1"
              keyboardType="numeric"
            />

            <Pressable style={styles.button} onPress={handleAddRecipe}>
              <Text style={styles.buttonText}>Add Recipe</Text>
            </Pressable>
          </View>
        );

      case "url":
        return (
          <View style={styles.tabContent}>
            <Text style={styles.infoText}>
              Paste a URL from any recipe website to automatically extract the
              recipe.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/recipe"
              value={urlInput}
              onChangeText={setUrlInput}
              autoCapitalize="none"
              keyboardType="url"
            />
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Extracting recipe...</Text>
              </View>
            ) : (
              <Pressable style={styles.button} onPress={handleUrlExtraction}>
                <Text style={styles.buttonText}>Extract Recipe</Text>
              </Pressable>
            )}
          </View>
        );

      case "ai":
        return (
          <View style={styles.tabContent}>
            <Text style={styles.infoText}>
              Upload a photo of a recipe or describe it in text, and we'll
              extract the details.
            </Text>
            <Pressable style={styles.uploadButton}>
              <Ionicons
                name="camera-outline"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.uploadButtonText}>Take a Photo</Text>
            </Pressable>
          </View>
        );

      case "instagram":
        return (
          <View style={styles.tabContent}>
            <Text style={styles.infoText}>
              Paste an Instagram post URL to extract the recipe.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="https://instagram.com/p/..."
              value={instagramUrl}
              onChangeText={setInstagramUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>
                  Extracting recipe from Instagram...
                </Text>
              </View>
            ) : (
              <Pressable
                style={styles.button}
                onPress={handleInstagramExtraction}
              >
                <Text style={styles.buttonText}>Extract from Instagram</Text>
              </Pressable>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close-outline" size={24} color={colors.gray[700]} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Recipe</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView>
        <View style={styles.tabs}>
          {renderTabButton("manual", "Manual", "create-outline")}
          {renderTabButton("url", "URL", "globe-outline")}
          {renderTabButton("ai", "Text/Photo", "camera-outline")}
          {renderTabButton("instagram", "Instagram", "logo-instagram")}
        </View>

        {renderTabContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "600",
    color: colors.gray[900],
  },
  closeButton: {
    padding: spacing.xs,
  },
  placeholder: {
    width: 24, // Same as close button icon size
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  activeTabLabel: {
    color: colors.primary,
    fontWeight: "500",
  },
  tabContent: {
    padding: spacing.lg,
  },
  label: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "500",
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.fontSizes.md,
  },
  row: {
    flexDirection: "row",
    marginHorizontal: -spacing.xs,
  },
  half: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: typography.fontSizes.md,
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    borderStyle: "dashed",
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtonText: {
    color: colors.primary,
    fontWeight: "500",
    marginTop: spacing.sm,
  },
  loadingContainer: {
    alignItems: "center",
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.gray[600],
    fontSize: typography.fontSizes.sm,
  },
  debugLog: {
    marginTop: spacing.md,
    color: colors.gray[600],
    fontSize: typography.fontSizes.sm,
  },
});
