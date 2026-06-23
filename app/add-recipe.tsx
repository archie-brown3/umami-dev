import React, { useState, useEffect } from "react";
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
import { colors, spacing, typography } from "@/utils/styleUtils";
import { useRecipes } from "@/context/RecipeContext";
import { Recipe, Ingredient } from "@/types";
import { scrapeFromUrl } from "@/services/deepseekservice";
import {
  extractRecipeFromUrl,
  extractRecipeFromInstagram,
  normalizeRecipe,
  validateRecipe,
  generateRecipeId,
} from "@/services/recipeExtractor";
import { analyzeRecipeText } from "@/services/deepseekservice";
import { extractRecipeFromTextOptimized } from "@/services/optimizedRecipeExtractor";
import { extractInstagramRecipe } from "@/services/instagramExtractor";

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
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [ingredients, setIngredients] = useState<string>("");
  const [instructions, setInstructions] = useState<string>("");
  const [tags, setTags] = useState<string>("");

  // States for URL and Instagram
  const [urlInput, setUrlInput] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [aiTextInput, setAiTextInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [recipeData, setRecipeData] = useState<Partial<Recipe> | null>(null);

  // Effect to populate form fields when recipe data is extracted
  useEffect(() => {
    if (recipeData) {
      setTitle(recipeData.title || "");
      setDescription(recipeData.description || "");
      setPrepTime(recipeData.prepTime?.toString() || "");
      setCookTime(recipeData.cookTime?.toString() || "");
      setServings(recipeData.servings?.toString() || "");

      // Convert ingredients array to text
      const ingredientsText =
        recipeData.ingredients
          ?.map((ing) => `${ing.amount} ${ing.unit} ${ing.name}`.trim())
          .join("\n") || "";
      setIngredients(ingredientsText);

      // Convert instructions array to text
      const instructionsText = recipeData.instructions?.join("\n") || "";
      setInstructions(instructionsText);

      // Convert tags array to text
      const tagsText = recipeData.tags?.join(", ") || "";
      setTags(tagsText);
    }
  }, [recipeData]);

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
          title: recipeData.title || recipeData.name || "Untitled Recipe",
          name: recipeData.name || recipeData.title || "Untitled Recipe",
          description: recipeData.description,
          ingredients: recipeData.ingredients || [],
          instructions: recipeData.instructions || [],
          prepTime: recipeData.prepTime || 0,
          cookTime: recipeData.cookTime || 0,
          servings: recipeData.servings || 2,
          imageUrl: scrapedContent.imageUrl,
          tags: recipeData.tags,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Step 4: Add the recipe to the user's collection
        const savedRecipe = await addRecipe(newRecipe);
        addLog(`Recipe added: ${savedRecipe.title}`);

        // Step 5: Return to the recipe detail page with success message
        Alert.alert(
          "Success",
          `Recipe "${savedRecipe.title}" has been successfully added to your collection.`,
          [
            {
              text: "OK",
              onPress: () => navigateAfterSuccess(savedRecipe.id),
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

      // Provide more helpful messages for specific error types
      if (
        errorMessage.includes("Network request failed") ||
        errorMessage.includes("Unable to connect") ||
        errorMessage.includes("Failed to fetch")
      ) {
        Alert.alert(
          "Network Error",
          "Unable to connect to the recipe extraction service. This could be due to your internet connection or the service being temporarily unavailable.",
          [
            {
              text: "Try Again",
              onPress: () => handleUrlExtraction(),
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
      } else if (
        errorMessage.includes("timed out") ||
        errorMessage.includes("timeout")
      ) {
        Alert.alert(
          "Request Timeout",
          "The extraction service took too long to respond. This could be due to server load or your internet connection.",
          [
            {
              text: "Try Again",
              onPress: () => handleUrlExtraction(),
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
      } else {
        Alert.alert("Error", `Failed to extract recipe: ${errorMessage}`);
      }
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
      addLog(`[Instagram] Starting extraction for URL: ${instagramUrl}`);

      // Use the new simplified Instagram extractor
      const recipe = await extractInstagramRecipe(instagramUrl);
      addLog(`[Instagram] Extraction successful: ${recipe.title}`);

      // Add the recipe directly (it's already a complete Recipe object)
      const savedRecipe = await addRecipe(recipe);
      addLog(`[Instagram] Recipe added: ${savedRecipe.title}`);

      // Return to the recipe detail page with success message
      Alert.alert(
        "Success",
        `Recipe "${savedRecipe.title}" has been successfully added from Instagram.`,
        [
          {
            text: "OK",
            onPress: () => navigateAfterSuccess(savedRecipe.id),
          },
        ]
      );
    } catch (error) {
      console.error("[Instagram] Extraction error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addLog(`[Instagram] Error: ${errorMessage}`);

      // The new extractor provides clear error messages already
      Alert.alert("Instagram Extraction Error", errorMessage, [
        {
          text: "Try Again",
          onPress: () => handleInstagramExtraction(),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract recipe from AI Text Input
  const handleAiTextExtraction = async () => {
    if (!aiTextInput.trim()) {
      Alert.alert("Error", "Please enter some recipe text.");
      return;
    }

    try {
      setIsLoading(true);
      addLog(
        `Analyzing recipe text with Optimized DeepSeek: ${aiTextInput.substring(
          0,
          100
        )}... (Total length: ${aiTextInput.length} chars)`
      );

      // Use the optimized AI analysis
      const recipeData = await extractRecipeFromTextOptimized(aiTextInput);

      console.log("[Debug] Recipe data from optimized extractor:", {
        title: recipeData?.title,
        ingredientCount: recipeData?.ingredients?.length || 0,
        instructionCount: recipeData?.instructions?.length || 0,
        tagCount: recipeData?.tags?.length || 0,
        hasDescription: !!recipeData?.description,
      });

      if (
        recipeData &&
        recipeData.title &&
        recipeData.title !== "Untitled Recipe"
      ) {
        addLog(`Successfully extracted recipe: "${recipeData.title}"`);

        // Set the extracted data
        setRecipeData(recipeData);
        setActiveTab("manual"); // Switch to manual tab to show the extracted data

        addLog("Recipe data populated. You can review and edit before saving.");
      } else {
        addLog("Failed to extract valid recipe data from text");
        Alert.alert(
          "Extraction Failed",
          "Could not extract a valid recipe from the provided text. Please check the text format and try again."
        );
      }
    } catch (error) {
      console.error("AI text extraction error:", error);
      addLog(
        `Text extraction failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      Alert.alert(
        "Error",
        `Failed to extract recipe from text: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Add a recipe manually
  const handleAddRecipe = async () => {
    // Enhanced validation
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a recipe title");
      return;
    }

    if (!ingredients.trim()) {
      Alert.alert("Error", "Please enter at least one ingredient");
      return;
    }

    if (!instructions.trim()) {
      Alert.alert("Error", "Please enter at least one instruction");
      return;
    }

    try {
      // Parse ingredients from text
      const parsedIngredients = ingredients
        .split("\n")
        .filter((line) => line.trim())
        .map((line, index) => {
          const trimmed = line.trim();
          // Try to parse amount, unit, and name
          const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(\w+)?\s+(.+)$/);
          if (match) {
            return {
              id: `ing-${index}`,
              amount: parseFloat(match[1]),
              unit: match[2] || "",
              name: match[3].trim(),
            };
          } else {
            // If parsing fails, treat the whole line as ingredient name
            return {
              id: `ing-${index}`,
              amount: 1,
              unit: "",
              name: trimmed,
            };
          }
        });

      // Parse instructions from text
      const parsedInstructions = instructions
        .split("\n")
        .filter((line) => line.trim())
        .map((line, index) => {
          const trimmed = line.trim();
          // Add numbering if not already present
          if (!/^\d+\./.test(trimmed)) {
            return `${index + 1}. ${trimmed}`;
          }
          return trimmed;
        });

      // Parse tags from text
      const parsedTags = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Create a recipe object that matches Recipe type
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        title: title.trim(),
        name: title.trim(), // For backward compatibility
        description: description.trim(),
        ingredients: parsedIngredients,
        instructions: parsedInstructions,
        prepTime: parseInt(prepTime) || 0,
        cookTime: parseInt(cookTime) || 0,
        servings: parseInt(servings) || 1,
        tags: parsedTags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addLog(
        `Creating recipe: ${newRecipe.title} with ${parsedIngredients.length} ingredients and ${parsedInstructions.length} instructions`
      );

      // Add the recipe to context
      const savedRecipe = await addRecipe(newRecipe);

      // Clear the extracted recipe data
      setRecipeData(null);

      // Show success message and navigate to recipe detail page
      Alert.alert(
        "Success",
        `Recipe "${savedRecipe.title}" has been successfully added to your collection.`,
        [
          {
            text: "OK",
            onPress: () => navigateAfterSuccess(savedRecipe.id),
          },
        ]
      );
    } catch (error) {
      console.error("Error adding manual recipe:", error);
      addLog(
        `Failed to add recipe: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      Alert.alert("Error", "Failed to add recipe. Please try again.");
    }
  };

  // Update the success alerts to use the correct navigation method
  const navigateAfterSuccess = (recipeId?: string) => {
    if (recipeId) {
      // Navigate to the specific recipe that was just created
      router.push(`/recipe/${recipeId}`);
    } else if (isModal) {
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
            {recipeData && (
              <View style={styles.extractedDataBanner}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.green[600]}
                />
                <Text style={styles.extractedDataText}>
                  Recipe data extracted! Review and edit below before saving.
                </Text>
              </View>
            )}

            <Text style={styles.label}>Recipe Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter recipe title"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of the recipe"
              multiline
              numberOfLines={3}
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

            <Text style={styles.label}>Ingredients</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={ingredients}
              onChangeText={setIngredients}
              placeholder="1 cup flour&#10;2 eggs&#10;1 tsp salt"
              multiline
              numberOfLines={6}
            />

            <Text style={styles.label}>Instructions</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={instructions}
              onChangeText={setInstructions}
              placeholder="1. Mix dry ingredients&#10;2. Add wet ingredients&#10;3. Bake for 30 minutes"
              multiline
              numberOfLines={6}
            />

            <Text style={styles.label}>Tags (comma separated)</Text>
            <TextInput
              style={styles.input}
              value={tags}
              onChangeText={setTags}
              placeholder="dinner, easy, vegetarian"
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
              Paste recipe text below, or upload a photo of a recipe, and we'll
              extract the details.
            </Text>

            <Text style={styles.label}>Recipe Text</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={aiTextInput}
              onChangeText={setAiTextInput}
              placeholder="Paste your recipe text here...\n\nExample:\nTitle: Chocolate Chip Cookies\nIngredients:\n- 1 cup flour\n- 1/2 cup sugar\n- ...\nInstructions:\n1. Mix flour and sugar.\n2. ..."
              multiline
              numberOfLines={8}
            />

            {isLoading && activeTab === "ai" && !urlInput && !instagramUrl ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Analyzing text...</Text>
              </View>
            ) : (
              <Pressable style={styles.button} onPress={handleAiTextExtraction}>
                <Ionicons
                  name="text-outline"
                  size={20}
                  color={colors.white}
                  style={{ marginRight: spacing.sm }}
                />
                <Text style={styles.buttonText}>Extract from Text</Text>
              </Pressable>
            )}

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable style={styles.uploadButton}>
              <Ionicons
                name="camera-outline"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.uploadButtonText}>
                Take or Upload a Photo
              </Text>
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
  multilineInput: {
    height: 150, // Adjust height for multiline input
    textAlignVertical: "top", // Align text to top for multiline
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
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[300],
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    color: colors.gray[500],
    fontWeight: "500",
  },
  extractedDataBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.green[600],
    borderRadius: 8,
    marginBottom: spacing.md,
  },
  extractedDataText: {
    marginLeft: spacing.md,
    color: colors.green[600],
    fontWeight: "500",
  },
});
