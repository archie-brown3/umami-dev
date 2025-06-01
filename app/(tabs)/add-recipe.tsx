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
import { analyzeRecipeText } from "@/services/deepseekservice";
import {
  extractRecipeFromUrl,
  validateRecipe,
  normalizeRecipe,
  testInstagramScraping,
  extractRecipeFromInstagramCaption,
  extractRecipeFromInstagram,
} from "@/services/recipeExtractor";
import { addRecipeToSupabase } from "@/services/recipeService";
import { supabase } from "@/lib/supabase";
import { RecipeCamera } from "@/components/RecipeCamera";
import { extractTextFromImage } from "@/services/textRecognition";
import * as ImagePicker from "expo-image-picker";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { Paywall } from "@/components/subscription/Paywall";

type TabType = "manual" | "url" | "ai" | "instagram";

export default function AddRecipeScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { addRecipe, recipes } = useRecipes();

  // Add feature gating
  const {
    canAddRecipe,
    canUseTextRecognition,
    paywallVisible,
    setPaywallVisible,
    blockedFeature,
  } = useFeatureGating();

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
    // Feature gating check
    const recipeCheck = canAddRecipe(recipes.length);
    if (!recipeCheck.hasAccess) {
      recipeCheck.showPaywall();
      return;
    }

    if (!urlInput.trim()) {
      Alert.alert("Error", "Please enter a recipe URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(urlInput.trim());
    } catch {
      Alert.alert(
        "Error",
        "Please enter a valid URL (e.g., https://example.com/recipe)"
      );
      return;
    }

    try {
      setIsLoading(true);
      addLog(`Extracting recipe from ${urlInput}...`);

      // Use the new extractRecipeFromUrl function which handles:
      // 1. Web scraping API for real content
      // 2. DeepSeek analysis for recipe formatting
      // 3. Validation and normalization
      const extractedRecipe = await extractRecipeFromUrl(urlInput);

      if (!extractedRecipe) {
        const errorMsg = "Failed to extract recipe from the URL";
        addLog(errorMsg);
        Alert.alert("Error", errorMsg);
        setIsLoading(false);
        return;
      }

      addLog(`Extraction successful! Title: "${extractedRecipe.title}"`);

      // The extractRecipeFromUrl already handles validation and normalization
      // So we can proceed directly to creating the recipe
      const newRecipe: Recipe = {
        id: Date.now().toString(),
        title: extractedRecipe.title || "Untitled Recipe",
        description: extractedRecipe.description || "",
        ingredients: extractedRecipe.ingredients || [],
        instructions: extractedRecipe.instructions || [],
        prepTime: extractedRecipe.prepTime || 0,
        cookTime: extractedRecipe.cookTime || 0,
        servings: extractedRecipe.servings || 2,
        imageUrl: extractedRecipe.imageUrl,
        author: extractedRecipe.author,
        sourceUrl: extractedRecipe.sourceUrl,
        tags: extractedRecipe.tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add the recipe to the user's collection
      addRecipe(newRecipe);
      addLog(`Recipe added: ${newRecipe.title}`);

      // Return to the previous screen with success message
      Alert.alert(
        "Success",
        `Recipe "${newRecipe.title}" has been successfully added to your collection.`,
        [
          {
            text: "OK",
            onPress: () => router.replace("/recipes"),
          },
        ]
      );
    } catch (error) {
      console.error("URL extraction error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      addLog(`Error: ${errorMessage}`);

      // Provide more helpful error messages
      let userMessage = `Failed to extract recipe: ${errorMessage}`;
      let actions: {
        text: string;
        style?: "default" | "cancel" | "destructive";
        onPress?: () => void;
      }[] = [{ text: "OK", style: "cancel" }];

      if (errorMessage.includes("validation failed")) {
        userMessage =
          "The webpage doesn't contain a complete recipe with ingredients and instructions. Please try a different URL or add the recipe manually.";
        actions = [
          { text: "Manual Entry", onPress: () => setActiveTab("manual") },
          { text: "OK", style: "cancel" },
        ];
      } else if (errorMessage.includes("No text content found")) {
        userMessage =
          "Unable to extract content from this webpage. It might be protected or doesn't contain readable text.";
        actions = [
          { text: "Try Different URL", style: "default" },
          { text: "Manual Entry", onPress: () => setActiveTab("manual") },
          { text: "Cancel", style: "cancel" },
        ];
      } else if (
        errorMessage.includes("Web Scraping API Error") ||
        errorMessage.includes("fetch")
      ) {
        userMessage =
          "The scraping service is temporarily unavailable. Please try again later or add the recipe manually.";
        actions = [
          { text: "Try Again", onPress: () => handleUrlExtraction() },
          { text: "Manual Entry", onPress: () => setActiveTab("manual") },
          { text: "Cancel", style: "cancel" },
        ];
      } else if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("network")
      ) {
        userMessage =
          "Network timeout occurred. Please check your internet connection and try again.";
        actions = [
          { text: "Try Again", onPress: () => handleUrlExtraction() },
          { text: "Cancel", style: "cancel" },
        ];
      }

      Alert.alert("Error", userMessage, actions);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract recipe from Instagram
  const handleInstagramExtraction = async () => {
    // Feature gating check
    const recipeCheck = canAddRecipe(recipes.length);
    if (!recipeCheck.hasAccess) {
      recipeCheck.showPaywall();
      return;
    }

    if (!instagramUrl.trim()) {
      Alert.alert("Error", "Please enter an Instagram post URL");
      return;
    }

    if (!instagramUrl.trim() || !instagramUrl.includes("instagram.com")) {
      Alert.alert("Error", "Please enter a valid Instagram URL");
      return;
    }

    try {
      setIsLoading(true);
      addLog(`Extracting recipe from ${instagramUrl}...`);

      // Step 1: Parse Instagram URL to extract username and post ID
      let extractedData: Partial<Recipe>;

      // Handle different Instagram URL formats
      if (instagramUrl.includes("/share/")) {
        // Share URL format: https://www.instagram.com/share/BBZ133yzEX
        addLog("Detected Instagram share URL format");

        // Use the testInstagramScraping function directly for share URLs
        const scrapingResult = await testInstagramScraping(instagramUrl);

        if (scrapingResult.success && scrapingResult.extractedData) {
          addLog(
            `Share URL scraping successful - Caption: ${scrapingResult.extractedData.caption.length} chars`
          );

          // Use the specialized Instagram caption extraction
          extractedData = await extractRecipeFromInstagramCaption(
            scrapingResult.extractedData.caption,
            scrapingResult.extractedData.username,
            instagramUrl,
            scrapingResult.extractedData.thumbnail || undefined
          );
        } else {
          throw new Error(
            `Share URL extraction failed: ${scrapingResult.message}`
          );
        }
      } else if (
        instagramUrl.includes("/p/") ||
        instagramUrl.includes("/reel/")
      ) {
        // Standard post URL format: https://www.instagram.com/username/p/postId/
        addLog("Detected standard Instagram post URL format");

        const urlMatch = instagramUrl.match(
          /instagram\.com\/(?:([^\/]+)\/)?(?:p|reel)\/([^\/\?]+)/
        );
        if (urlMatch) {
          const username = urlMatch[1] || "unknown";
          const postId = urlMatch[2];
          addLog(`Extracted username: ${username}, postId: ${postId}`);

          extractedData = await extractRecipeFromInstagram(username, postId);
        } else {
          throw new Error("Could not parse Instagram URL format");
        }
      } else {
        // Fallback: try general extraction
        addLog("Using fallback general extraction for Instagram URL");
        extractedData = await extractRecipeFromUrl(instagramUrl);
      }

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
            description: extractedData.description?.substring(0, 100) + "...",
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

        // Check if the errors are due to extraction failure (generic placeholders)
        const isExtractionFailure = validationErrors.some(
          (error) =>
            error.includes("generic placeholder") ||
            error.includes("extraction failed") ||
            error.includes("extraction may have failed")
        );

        if (isExtractionFailure) {
          Alert.alert(
            "Instagram Extraction Failed",
            "The Instagram post couldn't be automatically extracted. This often happens with Instagram's anti-bot measures.\n\nOptions:\n1. Try a different Instagram URL\n2. Copy the recipe text manually and use the 'AI Analysis' tab\n3. Add the recipe manually",
            [
              { text: "Try Different URL", style: "default" },
              { text: "Manual Entry", onPress: () => setActiveTab("manual") },
              { text: "AI Analysis", onPress: () => setActiveTab("ai") },
            ]
          );
        } else {
          Alert.alert(
            "Recipe Validation Failed",
            `The extracted recipe is incomplete:\n\n${validationErrors.join(
              "\n"
            )}\n\nPlease try again or add the recipe manually.`
          );
        }

        setIsLoading(false);
        return;
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
        author: validatedRecipe.author,
        sourceUrl: validatedRecipe.sourceUrl,
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
                onPress: () => router.replace("/recipes"),
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
              onPress: () => router.replace("/recipes"),
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

  // Handle AI text analysis
  const handleRecipeTextAnalysis = async () => {
    // Feature gating check for text recognition
    const textCheck = canUseTextRecognition();
    if (!textCheck.hasAccess) {
      textCheck.showPaywall();
      return;
    }

    // Recipe limit check
    const recipeCheck = canAddRecipe(recipes.length);
    if (!recipeCheck.hasAccess) {
      recipeCheck.showPaywall();
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
    // Feature gating check
    const recipeCheck = canAddRecipe(recipes.length);
    if (!recipeCheck.hasAccess) {
      recipeCheck.showPaywall();
      return;
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

      // Get current user and attempt to save to Supabase
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be logged in to create recipes");
      }

      const savedRecipe = await addRecipeToSupabase(newRecipe, user.id);

      if (savedRecipe) {
        addLog(`Manual recipe saved to Supabase: ${savedRecipe.title}`);
        Alert.alert(
          "Success",
          `Recipe "${savedRecipe.title}" has been successfully created! You can now edit it to add ingredients and instructions.`,
          [
            {
              text: "Edit Recipe",
              onPress: () => router.push(`/recipe/edit/${savedRecipe.id}`),
            },
            {
              text: "View Recipe",
              onPress: () => router.push(`/recipe/${savedRecipe.id}`),
            },
          ]
        );
      } else {
        throw new Error("Failed to save recipe to database");
      }
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
    // Feature gating check for text recognition
    const textCheck = canUseTextRecognition();
    if (!textCheck.hasAccess) {
      textCheck.showPaywall();
      return;
    }

    // Recipe limit check
    const recipeCheck = canAddRecipe(recipes.length);
    if (!recipeCheck.hasAccess) {
      recipeCheck.showPaywall();
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

                <View style={styles.photoButtonsContainer}>
                  <Pressable
                    style={[styles.uploadButton, styles.halfButton]}
                    onPress={() => {
                      // Feature gating check for text recognition
                      const textCheck = canUseTextRecognition();
                      if (!textCheck.hasAccess) {
                        textCheck.showPaywall();
                        return;
                      }

                      // Recipe limit check
                      const recipeCheck = canAddRecipe(recipes.length);
                      if (!recipeCheck.hasAccess) {
                        recipeCheck.showPaywall();
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

  // Test text extraction service when AI tab is opened
  useEffect(() => {
    if (activeTab === "ai") {
      testTextExtractionService();
    }
  }, [activeTab]);

  const testTextExtractionService = async () => {
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

      // Test ingredient parsing logic
      const { testIngredientParsing } = await import(
        "@/services/deepseekservice"
      );
      testIngredientParsing();

      // Test enhanced AI recipe quality
      const { testEnhancedRecipeQuality } = await import(
        "@/services/deepseekservice"
      );
      const qualityTestResult = await testEnhancedRecipeQuality();

      if (qualityTestResult.success) {
        console.log("[AddRecipe] Enhanced AI recipe quality tests passed");
      } else {
        console.warn(
          `[AddRecipe] AI recipe quality needs improvement: ${qualityTestResult.message}`
        );
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

      {/* Paywall for premium features */}
      <Paywall
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        feature={blockedFeature || "Premium Recipe Features"}
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
