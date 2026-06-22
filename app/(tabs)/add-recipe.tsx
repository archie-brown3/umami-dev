// app/(tabs)/add-recipe.tsx
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, typography } from "@/utils/styleUtils";
import { useRecipes } from "@/context/RecipeContext";
import { Recipe, Ingredient } from "@/types";
import {
  analyzeRecipeText,
  extractRecipeFromAnyUrl,
} from "@/services/deepseekservice";
import {
  extractRecipeFromUrl,
  validateRecipe,
  normalizeRecipe,
  testInstagramScraping,
  extractRecipeFromInstagramCaption,
  extractRecipeFromInstagram,
} from "@/services/recipeExtractor";
import { RecipeCamera } from "@/components/RecipeCamera";
import { extractTextFromImage } from "@/services/textRecognition";
import * as ImagePicker from "expo-image-picker";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { Paywall } from "@/components/subscription/Paywall";
import { useSubscription } from "@/context/SubscriptionContext";

type TabType = "manual" | "url" | "ai" | "instagram";

export default function AddRecipeScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { addRecipe, recipes } = useRecipes();

  // Add feature gating
  const {
    checkRecipeLimit,
    checkFeatureAccess,
    paywallVisible,
    setPaywallVisible,
  } = useFeatureGating();

  // Add subscription context
  const { canAccessFeature } = useSubscription();

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
    // Check if user can access URL extraction feature
    const hasAccess = await checkFeatureAccess("recipe_url_extraction", {
      alertTitle: "Premium Feature",
      alertMessage:
        "Recipe URL extraction is available for Premium users only!",
    });

    if (!hasAccess) {
      return; // Paywall already shown by checkFeatureAccess
    }

    if (!urlInput.trim()) {
      Alert.alert("Error", "Please enter a URL");
      return;
    }

    try {
      setIsLoading(true);
      addLog(`Starting unified URL extraction for: ${urlInput}`);

      // Use the enhanced unified extraction system
      const extractedData = await extractRecipeFromAnyUrl(urlInput);

      if (!extractedData) {
        throw new Error("Received empty response from extraction service");
      }

      addLog(
        `URL extraction successful: ${JSON.stringify(
          {
            title: extractedData.title,
            ingredientsCount: extractedData.ingredients?.length || 0,
            instructionsCount: extractedData.instructions?.length || 0,
          },
          null,
          2
        )}`
      );

      // Normalize the recipe data
      const normalizedData = normalizeRecipe(extractedData);

      // Validate the recipe
      const validationErrors = validateRecipe(normalizedData);
      if (validationErrors.length > 0) {
        addLog(`Validation failed: ${validationErrors.join(", ")}`);
        Alert.alert(
          "Recipe Validation Failed",
          `The extracted recipe is incomplete:\n\n${validationErrors.join(
            "\n"
          )}\n\nPlease try again or add the recipe manually.`
        );
        setIsLoading(false);
        return;
      }

      // Process the valid recipe
      await processValidRecipe(normalizedData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addLog(`Error: ${errorMessage}`);
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract recipe from Instagram
  const handleInstagramExtraction = async () => {
    // Check if user can access URL extraction feature
    const hasAccess = await checkFeatureAccess("recipe_url_extraction", {
      alertTitle: "Premium Feature",
      alertMessage:
        "Recipe extraction from Instagram is available for Premium users only!",
    });

    if (!hasAccess) {
      return; // Paywall already shown by checkFeatureAccess
    }

    if (!instagramUrl.trim()) {
      Alert.alert("Error", "Please enter an Instagram post URL");
      return;
    }

    if (!instagramUrl.includes("instagram.com")) {
      Alert.alert("Error", "Please enter a valid Instagram URL");
      return;
    }

    try {
      setIsLoading(true);
      addLog(`Enhanced extraction starting for: ${instagramUrl}`);

      // Use the enhanced unified extraction system
      const extractedData = await extractRecipeFromAnyUrl(instagramUrl);

      if (!extractedData) {
        throw new Error(
          "Received empty response from enhanced extraction service"
        );
      }

      addLog(
        `Enhanced extraction successful: ${JSON.stringify(
          {
            title: extractedData.title,
            ingredientsCount: extractedData.ingredients?.length || 0,
            instructionsCount: extractedData.instructions?.length || 0,
            description: extractedData.description?.substring(0, 100) + "...",
          },
          null,
          2
        )}`
      );

      // Normalize the recipe data
      const normalizedData = normalizeRecipe(extractedData);

      // Validate the recipe
      const validationErrors = validateRecipe(normalizedData);
      if (validationErrors.length > 0) {
        addLog(`Validation failed: ${validationErrors.join(", ")}`);
        Alert.alert(
          "Recipe Validation Failed",
          `The extracted recipe is incomplete:\n\n${validationErrors.join(
            "\n"
          )}\n\nPlease try again or add the recipe manually.`
        );
        setIsLoading(false);
        return;
      }

      // Process the valid recipe
      await processValidRecipe(normalizedData);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addLog(`Error: ${errorMessage}`);
      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to process a valid recipe
  const processValidRecipe = async (validatedRecipe: Partial<Recipe>) => {
    try {
      addLog("Recipe data is normalized and validated.");

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
        author: validatedRecipe.author,
        sourceUrl: validatedRecipe.sourceUrl,
        tags: validatedRecipe.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add the recipe using the context
      addRecipe(newRecipe);
      addLog(`Recipe added: ${newRecipe.title}`);

      Alert.alert(
        "Success",
        `Recipe "${newRecipe.title}" has been added to your collection.`,
        [
          {
            text: "OK",
            onPress: () => router.replace("/recipes"),
          },
        ]
      );
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

  // Handle AI text analysis
  const handleRecipeTextAnalysis = async () => {
    // Recipe limit check
    const canCreate = await checkRecipeLimit();
    if (!canCreate) {
      return; // Paywall already shown by checkRecipeLimit
    }

    // Feature gating check for text recognition
    const hasAccess = await checkFeatureAccess("text_recognition");
    if (!hasAccess) {
      return;
    }

    if (!recipeText.trim()) {
      Alert.alert("Error", "Please enter some recipe text to analyze");
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
      addLog("Analyzing extracted text with enhanced parsing...");

      // First try the enhanced recipe text parser
      let recipeData: Partial<Recipe> | null = null;

      try {
        const { parseRecipeFromText } = await import(
          "@/services/recipeTextParser"
        );
        recipeData = parseRecipeFromText(extractedText);
        addLog("Enhanced parsing successful - found structured recipe data");

        // Log what was found
        if (recipeData.title) addLog(`Title: ${recipeData.title}`);
        if (recipeData.ingredients?.length)
          addLog(`Ingredients: ${recipeData.ingredients.length} found`);
        if (recipeData.instructions?.length)
          addLog(`Instructions: ${recipeData.instructions.length} steps`);
        if (recipeData.servings) addLog(`Servings: ${recipeData.servings}`);
        if (recipeData.prepTime || recipeData.cookTime) {
          addLog(
            `Time: ${recipeData.prepTime || 0}min prep + ${
              recipeData.cookTime || 0
            }min cook`
          );
        }
      } catch (parseError) {
        addLog("Enhanced parsing failed, falling back to AI analysis...");
        console.warn("Enhanced parsing failed:", parseError);

        // Fallback to AI analysis
        recipeData = await analyzeRecipeText(extractedText);
      }

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
    // Recipe limit check
    const canCreate = await checkRecipeLimit();
    if (!canCreate) {
      return; // Paywall already shown by checkRecipeLimit
    }

    // Enhanced validation
    if (!title.trim()) {
      Alert.alert("Error", "Please enter a recipe title");
      return;
    }

    if (title.trim().length < 3) {
      Alert.alert("Error", "Recipe title must be at least 3 characters long");
      return;
    }

    // Validate numeric inputs
    const prepTimeNum = parseInt(prepTime) || 0;
    const cookTimeNum = parseInt(cookTime) || 0;
    const servingsNum = parseInt(servings) || 1;

    if (prepTimeNum < 0 || prepTimeNum > 1440) {
      Alert.alert("Error", "Prep time must be between 0 and 1440 minutes");
      return;
    }

    if (cookTimeNum < 0 || cookTimeNum > 1440) {
      Alert.alert("Error", "Cook time must be between 0 and 1440 minutes");
      return;
    }

    if (servingsNum < 1 || servingsNum > 100) {
      Alert.alert("Error", "Servings must be between 1 and 100");
      return;
    }

    try {
      setIsLoading(true);
      addLog(`Creating manual recipe: ${title.trim()}`);

      // Create a recipe object that matches Recipe type
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        title: title.trim(),
        description: "Quick recipe - edit to add more details",
        ingredients: [
          {
            id: "ing-1",
            name: "Add your ingredients",
            amount: 1,
            unit: "item",
          },
        ],
        instructions: ["Add your cooking instructions here"],
        prepTime: prepTimeNum,
        cookTime: cookTimeNum,
        servings: servingsNum,
        tags: ["Quick Add"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add the recipe using the context
      addRecipe(newRecipe);
      addLog(`Manual recipe created: ${newRecipe.title}`);

      Alert.alert(
        "Success",
        `Recipe "${newRecipe.title}" has been successfully created! You can now edit it to add ingredients and instructions.`,
        [
          {
            text: "Edit Recipe",
            onPress: () => router.push(`/recipe/edit/${newRecipe.id}`),
          },
          {
            text: "View Recipe",
            onPress: () => router.push(`/recipe/${newRecipe.id}`),
          },
        ]
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      addLog(`Failed to save manual recipe: ${errorMessage}`);
      console.error("Error creating manual recipe:", error);

      Alert.alert(
        "Error",
        `Failed to create recipe: ${errorMessage}. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle photo selection from camera roll
  const handlePhotoSelection = async () => {
    // Recipe limit check
    const canCreate = await checkRecipeLimit();
    if (!canCreate) {
      return; // Paywall already shown by checkRecipeLimit
    }

    // Feature gating check for text recognition
    const hasAccess = await checkFeatureAccess("text_recognition");
    if (!hasAccess) {
      return;
    }

    try {
      // Request permission to access media library
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Permission to access camera roll is required to select photos."
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];

        // Process the selected image through the text extraction pipeline
        setIsLoading(true);
        addLog("Processing selected photo...");

        try {
          // Import the enhanced text extraction and parsing service
          const { extractAndParseRecipeFromImage } = await import(
            "@/services/recipeTextParser"
          );

          // Extract and parse recipe data from the selected image
          const parsedRecipe = await extractAndParseRecipeFromImage(
            selectedImage.uri
          );

          if (
            !parsedRecipe ||
            (!parsedRecipe.title &&
              (!parsedRecipe.ingredients ||
                parsedRecipe.ingredients.length === 0))
          ) {
            Alert.alert(
              "No Recipe Found",
              "No recipe structure could be identified in this image. This could be due to:\n\n• Poor image quality or lighting\n• Text is too small or blurry\n• Image doesn't contain a complete recipe\n\nPlease try a different photo or enter the recipe manually.",
              [
                {
                  text: "Try Another Photo",
                  onPress: () => handlePhotoSelection(),
                },
                { text: "Manual Entry", onPress: () => setActiveTab("manual") },
                { text: "Cancel", style: "cancel" },
              ]
            );
            setIsLoading(false);
            return;
          }

          addLog("Enhanced parsing successful from photo!");
          if (parsedRecipe.title) addLog(`Title: ${parsedRecipe.title}`);
          if (parsedRecipe.ingredients?.length)
            addLog(`Ingredients: ${parsedRecipe.ingredients.length} found`);
          if (parsedRecipe.instructions?.length)
            addLog(`Instructions: ${parsedRecipe.instructions.length} steps`);

          // Process the parsed recipe data
          const normalizedData = normalizeRecipe(parsedRecipe);
          const validationErrors = validateRecipe(normalizedData);

          if (validationErrors.length > 0) {
            addLog(`Validation warnings: ${validationErrors.join(", ")}`);

            // For photo extraction, be more lenient with validation
            Alert.alert(
              "Recipe Extracted with Warnings",
              `The recipe was extracted but may be incomplete:\n\n${validationErrors.join(
                "\n"
              )}\n\nWould you like to continue and edit the details manually?`,
              [
                {
                  text: "Try Another Photo",
                  onPress: () => handlePhotoSelection(),
                },
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: () => setIsLoading(false),
                },
                {
                  text: "Continue & Edit",
                  onPress: async () => {
                    // Ensure we have at least basic structure
                    if (
                      !normalizedData.ingredients ||
                      normalizedData.ingredients.length === 0
                    ) {
                      normalizedData.ingredients = [
                        {
                          id: `placeholder-${Date.now()}`,
                          name: "Add ingredients manually",
                          amount: 1,
                          unit: "item",
                        },
                      ];
                    }

                    if (
                      !normalizedData.instructions ||
                      normalizedData.instructions.length === 0
                    ) {
                      normalizedData.instructions = [
                        "Add cooking instructions here",
                      ];
                    }

                    await processValidRecipe(normalizedData);
                  },
                },
              ]
            );
            return;
          }

          // Process the valid recipe
          await processValidRecipe(normalizedData);
        } catch (error) {
          console.error("Error processing selected photo:", error);
          setIsLoading(false);

          let errorMessage = "Failed to process the selected photo.";
          let actions: {
            text: string;
            style?: "default" | "cancel" | "destructive";
            onPress?: () => void;
          }[] = [
            {
              text: "Try Another Photo",
              onPress: () => handlePhotoSelection(),
            },
            { text: "Manual Entry", onPress: () => setActiveTab("manual") },
            { text: "Cancel", style: "cancel" },
          ];

          if (error instanceof Error) {
            if (error.message.includes("quota")) {
              errorMessage =
                "OCR service quota exceeded. Please try again later or enter the recipe manually.";
              actions = [
                { text: "Manual Entry", onPress: () => setActiveTab("manual") },
                { text: "OK", style: "cancel" },
              ];
            } else if (error.message.includes("authentication")) {
              errorMessage =
                "OCR service is temporarily unavailable. Please try manual entry.";
              actions = [
                { text: "Manual Entry", onPress: () => setActiveTab("manual") },
                { text: "OK", style: "cancel" },
              ];
            } else if (error.message.includes("confidence too low")) {
              errorMessage =
                "The image quality is too low for text extraction. Please try a clearer photo with better lighting.";
            }
          }

          Alert.alert("Error", errorMessage, actions);
        }
      }
    } catch (error) {
      console.error("Error selecting photo:", error);
      setIsLoading(false);
      Alert.alert("Error", "Failed to select photo. Please try again.");
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
            {/* New Create Screen Option */}
            <View style={styles.createOptionCard}>
              <View style={styles.createOptionHeader}>
                <Ionicons name="restaurant" size={24} color={colors.primary} />
                <Text style={styles.createOptionTitle}>
                  Full Recipe Creator
                </Text>
              </View>
              <Text style={styles.createOptionDescription}>
                Create a complete recipe with ingredients, instructions, photos,
                and more using our comprehensive editor.
              </Text>
              <Pressable
                style={styles.createButton}
                onPress={() => router.push("/recipe/create")}
              >
                <Ionicons name="add-circle" size={20} color={colors.white} />
                <Text style={styles.createButtonText}>Create Recipe</Text>
              </Pressable>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR QUICK ADD</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Quick Add Form */}
            <View style={styles.quickAddSection}>
              <Text style={styles.quickAddTitle}>Quick Add Recipe</Text>
              <Text style={styles.quickAddSubtitle}>
                Add basic recipe details quickly (you can edit later)
              </Text>

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
                <Text style={styles.buttonText}>Quick Add Recipe</Text>
              </Pressable>
            </View>
          </View>
        );

      case "url":
        return (
          <View style={styles.tabContent}>
            <Text style={styles.infoText}>
              Paste a URL from any recipe website or social media post to
              automatically extract the recipe.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/recipe or Instagram URL"
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

                <View style={styles.photoButtonsContainer}>
                  <Pressable
                    style={[styles.uploadButton, styles.halfButton]}
                    onPress={async () => {
                      // Feature gating check for text recognition
                      const hasAccess = await checkFeatureAccess(
                        "text_recognition"
                      );
                      if (!hasAccess) {
                        return;
                      }

                      setShowCamera(true);
                    }}
                  >
                    <Ionicons
                      name="camera-outline"
                      size={24}
                      color={colors.primary}
                    />
                    <Text style={styles.uploadButtonText}>Take Photo</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.uploadButton, styles.halfButton]}
                    onPress={handlePhotoSelection}
                  >
                    <Ionicons
                      name="images-outline"
                      size={24}
                      color={colors.primary}
                    />
                    <Text style={styles.uploadButtonText}>Choose Photo</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </>
        );

      case "instagram":
        return (
          <View style={styles.tabContent}>
            <Text style={styles.infoText}>
              Paste an Instagram recipe post URL to extract ingredients and
              instructions with AI-powered analysis.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="https://instagram.com/p/... or /share/..."
              value={instagramUrl}
              onChangeText={setInstagramUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>
                  Extracting recipe with AI analysis...
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

  // Test text extraction service when AI tab is opened
  useEffect(() => {
    if (activeTab === "ai") {
      testTextExtractionService();
    }
  }, [activeTab]);

  const testTextExtractionService = async () => {
    // Recipe limit check
    const canCreate = await checkRecipeLimit();
    if (!canCreate) {
      return; // Paywall already shown by checkRecipeLimit
    }

    try {
      const { testTextExtractionService } = await import(
        "@/services/textRecognition"
      );
      const testResult = await testTextExtractionService();

      if (!testResult.isConfigured) {
        console.warn(
          "[AddRecipe] Text extraction service not configured, using fallback"
        );
      } else if (!testResult.isWorking) {
        console.warn(
          `[AddRecipe] Text extraction service issue: ${testResult.error}`
        );
      } else {
        console.log("[AddRecipe] Text extraction service is working properly");
      }
    } catch (error) {
      console.error(
        "[AddRecipe] Error testing text extraction service:",
        error
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add Recipe</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 70 }}>
        <View style={styles.tabs}>
          {renderTabButton("manual", "Manual", "create-outline")}
          {renderTabButton("url", "URL", "globe-outline")}
          {renderTabButton("ai", "Text/Photo", "camera-outline")}
          {renderTabButton("instagram", "Instagram", "logo-instagram")}
        </View>

        {renderTabContent()}
      </ScrollView>

      {/* Paywall */}
      <Paywall
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
      />
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
  createOptionCard: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 8,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  createOptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  createOptionTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600",
    color: colors.gray[900],
    marginLeft: spacing.md,
  },
  createOptionDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  createButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: typography.fontSizes.md,
    marginLeft: spacing.xs,
  },
  quickAddSection: {
    padding: spacing.lg,
  },
  quickAddTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600",
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  quickAddSubtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
  },
  photoButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  halfButton: {
    flex: 1,
  },
});
