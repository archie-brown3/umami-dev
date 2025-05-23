// app/(tabs)/add-recipe.tsx
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
import { colors, spacing, typography } from "@/utils/styleUtils";
import { useRecipes } from "@/context/RecipeContext";
import { Recipe, Ingredient } from "@/types";
import { scrapeFromUrl, analyzeRecipeText } from "@/services/deepseekservice";
import {
  extractRecipeFromUrl,
  validateRecipe,
  normalizeRecipe,
} from "@/services/recipeExtractor";
import { addRecipeToSupabase } from "@/services/recipeService";
import { supabase } from "@/lib/supabase";
import { RecipeCamera } from "@/components/RecipeCamera";
import { extractTextFromImage } from "@/services/textRecognition";

type TabType = "manual" | "url" | "ai" | "instagram";

export default function AddRecipeScreen() {
  const params = useLocalSearchParams();
  const { addRecipe } = useRecipes();

  // Get the active tab from URL params or default to manual
  const initialTab = (params?.tab as TabType) || "manual";
  const previousScreen = (params?.previousScreen as string) || "/recipes";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Form state for manual input
  const [title, setTitle] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");

  // States for URL and Instagram
  const [urlInput, setUrlInput] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [recipeText, setRecipeText] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // Add a log function
  const addLog = (message: string) => {
    console.log(`[Debug] ${message}`);
    setDebugLogs((prev) => [
      ...prev,
      `[${new Date().toISOString()}] ${message}`,
    ]);
  };

  // Extract recipe from URL
  const handleUrlExtraction = async () => {
    if (!urlInput.trim()) {
      Alert.alert("Error", "Please enter a recipe URL");
      return;
    }

    try {
      setIsLoading(true);
      addLog(`Extracting recipe from ${urlInput}...`);

      // Step 1: Scrape the content from the URL
      const scrapedContent = await scrapeFromUrl(urlInput);

      if (!scrapedContent || !scrapedContent.caption) {
        const errorMsg = "Failed to extract content from the URL";
        addLog(errorMsg);
        Alert.alert("Error", errorMsg);
        setIsLoading(false);
        return;
      }

      addLog(`Scraped content: ${scrapedContent.caption.substring(0, 100)}...`);

      // Step 2: Analyze the scraped text
      const recipeData = await analyzeRecipeText(scrapedContent.caption);

      if (recipeData) {
        addLog("Recipe analysis successful!");

        // Normalize the recipe data
        const normalizedData = normalizeRecipe(recipeData);

        // Validate the recipe
        const validationErrors = validateRecipe(normalizedData);
        if (validationErrors.length > 0) {
          addLog(`Validation failed: ${validationErrors.join(", ")}`);
          Alert.alert(
            "Error",
            `Recipe is incomplete: ${validationErrors.join(", ")}`
          );
          setIsLoading(false);
          return;
        }

        addLog("Recipe data is normalized and validated.");

        // Step 3: Create a valid Recipe object
        const newRecipe: Recipe = {
          id: Date.now().toString(),
          title: normalizedData.title || "Untitled Recipe",
          description: normalizedData.description || "",
          ingredients: normalizedData.ingredients || [],
          instructions: normalizedData.instructions || [],
          prepTime: normalizedData.prepTime || 0,
          cookTime: normalizedData.cookTime || 0,
          servings: normalizedData.servings || 2,
          imageUrl: scrapedContent.imageUrl,
          tags: normalizedData.tags,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Step 4: Add the recipe to the user's collection
        addRecipe(newRecipe);
        addLog(`Recipe added: ${newRecipe.title}`);

        // Step 5: Return to the previous screen with success message
        Alert.alert(
          "Success",
          `Recipe "${newRecipe.title}" has been successfully added to your collection.`,
          [
            {
              text: "OK",
              onPress: () => router.push("/recipes"),
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
          {
            title: extractedData.title,
            ingredientsCount: extractedData.ingredients?.length || 0,
            instructionsCount: extractedData.instructions?.length || 0,
          },
          null,
          2
        )}`
      );

      // Check if we have ingredients and instructions before proceeding
      if (
        !extractedData.ingredients ||
        extractedData.ingredients.length === 0
      ) {
        addLog(`Warning: No ingredients found in extracted data.`);

        // If we have the original text, we can retry with manual analysis
        if (extractedData.originalText) {
          addLog(`Attempting to extract ingredients from original text...`);
          try {
            // Try again with direct text analysis
            const reanalyzedData = await analyzeRecipeText(
              extractedData.originalText
            );
            if (
              reanalyzedData.ingredients &&
              reanalyzedData.ingredients.length > 0
            ) {
              addLog(
                `Successfully extracted ${reanalyzedData.ingredients.length} ingredients from text.`
              );
              extractedData.ingredients = reanalyzedData.ingredients;
            }
          } catch (reanalysisError) {
            addLog(
              `Failed to extract ingredients from text: ${reanalysisError}`
            );
          }
        }
      }

      // Normalize the recipe data
      const normalizedData = normalizeRecipe(extractedData);

      // Validate the recipe
      const validationErrors = validateRecipe(normalizedData);
      if (validationErrors.length > 0) {
        addLog(`Validation failed: ${validationErrors.join(", ")}`);

        // If the only validation error is about ingredients or instructions, offer to proceed anyway
        if (
          validationErrors.length === 1 &&
          (validationErrors[0].includes("ingredient") ||
            validationErrors[0].includes("instruction"))
        ) {
          Alert.alert(
            "Incomplete Recipe",
            `${validationErrors[0]}. Would you like to add them manually later?`,
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                  setIsLoading(false);
                },
              },
              {
                text: "Continue Anyway",
                onPress: async () => {
                  // If missing ingredients, add a placeholder
                  if (validationErrors[0].includes("ingredient")) {
                    normalizedData.ingredients = [
                      {
                        id: `placeholder-${Date.now()}`,
                        name: "Add ingredients manually",
                        amount: 1,
                        unit: "item",
                      },
                    ];
                  }

                  // If missing instructions, add a placeholder
                  if (validationErrors[0].includes("instruction")) {
                    normalizedData.instructions = [
                      "Add cooking instructions manually",
                    ];
                  }

                  // Continue with recipe creation
                  await processValidRecipe(normalizedData);
                },
              },
            ]
          );
          return;
        } else {
          // For other validation errors, show the standard error
          Alert.alert(
            "Error",
            `Recipe is incomplete: ${validationErrors.join(", ")}`
          );
          setIsLoading(false);
          return;
        }
      }

      // Process the valid recipe
      await processValidRecipe(normalizedData);
    } catch (error) {
      console.error("Instagram extraction error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addLog(`Error: ${errorMessage}`);
      Alert.alert("Error", `Failed to extract recipe: ${errorMessage}`);
      setIsLoading(false);
    }
  };

  // Helper function to process a valid recipe
  const processValidRecipe = async (validatedRecipe: Partial<Recipe>) => {
    try {
      addLog("Recipe data is normalized and validated.");

      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Prepare the recipe for saving
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        title: validatedRecipe.title || "Untitled Recipe",
        description: validatedRecipe.description || "",
        ingredients: validatedRecipe.ingredients || [],
        instructions: validatedRecipe.instructions || [],
        prepTime: validatedRecipe.prepTime || 0,
        cookTime: validatedRecipe.cookTime || 0,
        servings: validatedRecipe.servings || 2,
        imageUrl: validatedRecipe.imageUrl,
        tags: validatedRecipe.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to Supabase if user is logged in
      if (user) {
        const savedRecipe = await addRecipeToSupabase(newRecipe, user.id);
        if (savedRecipe) {
          addLog(`Recipe saved to Supabase: ${savedRecipe.title}`);

          // Navigate back to recipes screen
          Alert.alert(
            "Success",
            `Recipe "${savedRecipe.title}" has been successfully saved.`,
            [
              {
                text: "OK",
                onPress: () => router.push("/recipes"),
              },
            ]
          );
        } else {
          // Error alert is handled in addRecipeToSupabase
          setIsLoading(false);
        }
      } else {
        // If no user, just add to local state
        addRecipe(newRecipe);
        addLog(`Recipe added to local state: ${newRecipe.title}`);

        Alert.alert(
          "Success",
          `Recipe "${newRecipe.title}" has been added to your collection.`,
          [
            {
              text: "OK",
              onPress: () => router.push("/recipes"),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error processing recipe:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addLog(`Error processing recipe: ${errorMessage}`);
      Alert.alert("Error", `Failed to save recipe: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle recipe text analysis
  const handleRecipeTextAnalysis = async () => {
    if (!recipeText.trim()) {
      Alert.alert("Error", "Please enter your recipe text");
      return;
    }

    try {
      setIsLoading(true);
      addLog("Analyzing recipe text...");

      const recipeData = await analyzeRecipeText(recipeText);

      if (!recipeData) {
        const errorMsg = "Failed to analyze the recipe text";
        addLog(errorMsg);
        Alert.alert("Error", errorMsg);
        return;
      }

      addLog("Recipe analyzed successfully!");
      Alert.alert("Success", "Recipe has been analyzed and saved!");
      setRecipeText("");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "An error occurred";
      addLog(`Error: ${errorMsg}`);
      Alert.alert("Error", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle text extracted from camera
  const handleCameraTextExtracted = async (extractedText: string) => {
    setShowCamera(false);
    setRecipeText(extractedText);

    try {
      setIsLoading(true);
      addLog("Analyzing extracted text...");

      const recipeData = await analyzeRecipeText(extractedText);

      if (!recipeData) {
        const errorMsg = "Failed to analyze the recipe text";
        addLog(errorMsg);
        Alert.alert("Error", errorMsg);
        setIsLoading(false);
        return;
      }

      // Normalize the recipe data
      const normalizedData = normalizeRecipe(recipeData);

      // Validate the recipe
      const validationErrors = validateRecipe(normalizedData);
      if (validationErrors.length > 0) {
        addLog(`Validation failed: ${validationErrors.join(", ")}`);

        // If the only validation error is about ingredients, offer to proceed anyway
        if (
          validationErrors.length === 1 &&
          validationErrors[0].includes("ingredient")
        ) {
          Alert.alert(
            "Incomplete Recipe",
            "No ingredients were found in this recipe. Would you like to add them manually later?",
            [
              {
                text: "Cancel",
                style: "cancel",
                onPress: () => {
                  setIsLoading(false);
                },
              },
              {
                text: "Continue Anyway",
                onPress: async () => {
                  // Add a placeholder ingredient
                  normalizedData.ingredients = [
                    {
                      id: `placeholder-${Date.now()}`,
                      name: "Add ingredients manually",
                      amount: 1,
                      unit: "item",
                    },
                  ];

                  // Continue with recipe creation
                  await processValidRecipe(normalizedData);
                },
              },
            ]
          );
          return;
        } else {
          Alert.alert(
            "Error",
            `Recipe is incomplete: ${validationErrors.join(", ")}`
          );
          setIsLoading(false);
          return;
        }
      }

      // Process the valid recipe
      await processValidRecipe(normalizedData);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "An error occurred";
      addLog(`Error: ${errorMsg}`);
      Alert.alert("Error", errorMsg);
      setIsLoading(false);
    }
  };

  // Add a recipe manually
  const handleAddRecipe = async () => {
    // Very basic validation
    if (!title) {
      Alert.alert("Error", "Please enter a title");
      return;
    }

    // Create a recipe object that matches Recipe type
    const newRecipe: Recipe = {
      id: Date.now().toString(),
      title: title,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Get current user and attempt to save to Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const savedRecipe = await addRecipeToSupabase(newRecipe, user?.id);

    if (savedRecipe) {
      // Optionally, update local state/context if needed
      // addRecipe(savedRecipe); // Pass the recipe returned from Supabase
      addLog(`Manual recipe saved to Supabase: ${savedRecipe.title}`);
      Alert.alert(
        "Success",
        `Recipe "${savedRecipe.title}" has been successfully saved.`,
        [
          {
            text: "OK",
            onPress: () => router.push("/recipes"),
          },
        ]
      );
    } else {
      addLog(`Failed to save manual recipe to Supabase.`);
      // Error alert is handled in addRecipeToSupabase
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
          <>
            {showCamera ? (
              <RecipeCamera
                onTextExtracted={handleCameraTextExtracted}
                onClose={() => setShowCamera(false)}
              />
            ) : (
              <View style={styles.tabContent}>
                <Text style={styles.infoText}>
                  Upload a photo of a recipe or paste your recipe text below,
                  and we'll extract the details.
                </Text>

                <TextInput
                  style={[styles.input, styles.multilineInput]}
                  placeholder="Paste your recipe text here..."
                  value={recipeText}
                  onChangeText={setRecipeText}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />

                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Analyzing recipe...</Text>
                  </View>
                ) : (
                  <Pressable
                    style={styles.button}
                    onPress={handleRecipeTextAnalysis}
                  >
                    <Text style={styles.buttonText}>Analyze Recipe Text</Text>
                  </Pressable>
                )}

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable
                  style={styles.uploadButton}
                  onPress={() => setShowCamera(true)}
                >
                  <Ionicons
                    name="camera-outline"
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.uploadButtonText}>Take a Photo</Text>
                </Pressable>
              </View>
            )}
          </>
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
        <Text style={styles.headerTitle}>Add Recipe</Text>
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
    justifyContent: "center",
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
  multilineInput: {
    height: 120,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[300],
  },
  dividerText: {
    marginHorizontal: 10,
    color: colors.gray[500],
    fontSize: 14,
  },
});
