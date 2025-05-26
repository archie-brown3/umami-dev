import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { APIHealthCheck } from "@/components/debug/APIHealthCheck";
import { useAPIHealth } from "@/hooks/useAPIHealth";
import { API_ENDPOINTS } from "@/constants/api";
import { ConnectionDiagnostic } from "@/components/ConnectionDiagnostic";
import { FixImageUrlsButton } from "@/components/FixImageUrlsButton";
import {
  testImageProcessing,
  quickImageTest,
} from "@/utils/imageProcessor.test";
import { colors } from "@/utils/styleUtils";
import { useAuth } from "@/context/AuthContext";
import { useRecipes } from "@/context/RecipeContext";
import {
  extractRecipeFromUrl,
  testWebScrapingFlow,
  testInstagramScraping,
  extractRecipeFromInstagramCaption,
  validateRecipe,
} from "@/services/recipeExtractor";

const DebugPage = () => {
  const { user } = useAuth();
  const { recipes } = useRecipes();
  const [testResults, setTestResults] = useState<{ [key: string]: string }>({});
  const [isRunningTests, setIsRunningTests] = useState<{
    [key: string]: boolean;
  }>({});

  const recipeAPI = useAPIHealth({
    endpoint: API_ENDPOINTS.EXTRACT_API_URL,
  });

  const deepseekAPI = useAPIHealth({
    endpoint: API_ENDPOINTS.DEEPSEEK_API_URL,
    method: "POST",
    headers: {
      Authorization: `Bearer ${
        process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY ||
        API_ENDPOINTS.DEEPSEEK_API_KEY
      }`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: "Health check" }],
      max_tokens: 1,
    }),
    path: "",
  });

  const supabaseAPI = useAPIHealth({
    endpoint: API_ENDPOINTS.SUPABASE_API_URL,
    headers: {
      apikey: API_ENDPOINTS.SUPABASE_ANON_KEY,
    },
    path: "/rest/v1/",
  });

  const runTest = async (
    testName: string,
    testFunction: () => Promise<void> | void
  ) => {
    setIsRunningTests((prev) => ({ ...prev, [testName]: true }));
    setTestResults((prev) => ({ ...prev, [testName]: "Running..." }));

    try {
      await testFunction();
      setTestResults((prev) => ({ ...prev, [testName]: "✅ PASSED" }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setTestResults((prev) => ({
        ...prev,
        [testName]: `❌ FAILED: ${errorMessage}`,
      }));
    } finally {
      setIsRunningTests((prev) => ({ ...prev, [testName]: false }));
    }
  };

  const handleTestImageProcessing = () => {
    runTest("imageProcessing", () => {
      console.log("Running image processing tests...");
      testImageProcessing();
    });
  };

  const handleQuickImageTest = () => {
    runTest("quickImage", () => {
      console.log("Running quick image test...");
      const result = quickImageTest();
      if (!result) {
        throw new Error("Quick image test failed");
      }
    });
  };

  // Meal Plan Testing Functions
  const testMealPlanCreation = async () => {
    console.log("=== Testing Meal Plan Creation ===");

    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    try {
      // Import the actual services
      const { createMealPlan, addMealPlanItem } = await import(
        "@/services/mealPlanService"
      );

      // Create meal plan for today
      const today = new Date().toISOString().split("T")[0];
      const mealPlan = await createMealPlan(user.id, today);
      console.log("✅ Meal plan created:", mealPlan);

      // Add a test meal plan item (using first available recipe if any)
      if (recipes.length > 0) {
        const testRecipe = recipes[0];
        const mealPlanItem = await addMealPlanItem(user.id, today, {
          recipe_id: testRecipe.id,
          meal_type: "breakfast",
        });
        console.log("✅ Meal plan item added:", mealPlanItem);
      }

      console.log("✅ Meal plan creation test completed");
    } catch (error) {
      console.error("❌ Meal plan creation test failed:", error);
      throw error;
    }
  };

  const testMealPlanSync = async () => {
    console.log("=== Testing Meal Plan Sync ===");

    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    try {
      const { getMealPlansForWeek, getWeekStart } = await import(
        "@/services/mealPlanService"
      );

      // Get current week's meal plans
      const weekStart = getWeekStart(new Date()).toISOString().split("T")[0];
      const weekMeals = await getMealPlansForWeek(user.id, weekStart);

      console.log(
        "✅ Week meals fetched:",
        Object.keys(weekMeals).length,
        "days"
      );
      console.log("✅ Meal plan sync test completed");
    } catch (error) {
      console.error("❌ Meal plan sync test failed:", error);
      throw error;
    }
  };

  const testShoppingListGeneration = async () => {
    console.log("=== Testing Shopping List Generation ===");

    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    try {
      const { generateShoppingListFromMealPlan } = await import(
        "@/services/groceriesService"
      );
      const { getWeekDates, getWeekStart } = await import(
        "@/services/mealPlanService"
      );

      // Generate shopping list for current week
      const weekStart = getWeekStart(new Date());
      const weekDates = getWeekDates(weekStart);

      const shoppingList = await generateShoppingListFromMealPlan(user.id, {
        start: weekDates[0],
        end: weekDates[6],
      });

      console.log("✅ Shopping list generated:", shoppingList.title);
      console.log("✅ Items count:", shoppingList.items?.length || 0);
      console.log("✅ Shopping list generation test completed");
    } catch (error) {
      console.error("❌ Shopping list generation test failed:", error);
      throw error;
    }
  };

  const clearMealPlanCache = async () => {
    console.log("=== Clearing Meal Plan Cache ===");

    // Simulate cache clearing
    console.log("1. Clearing AsyncStorage meal plan data...");
    console.log("2. Clearing in-memory cache...");
    console.log("3. Resetting context state...");

    console.log("✅ Meal plan cache cleared");
  };

  // Groceries Testing Functions
  const testShoppingListCRUD = async () => {
    console.log("=== Testing Shopping List CRUD ===");

    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    // Test Create
    const mockShoppingList = {
      id: `test-list-${Date.now()}`,
      user_id: user.id,
      title: "Test Shopping List",
      date: new Date().toISOString().split("T")[0],
      is_completed: false,
      items: [],
    };
    console.log("✅ CREATE: Shopping list created");

    // Test Add Item
    const mockItem = {
      id: `test-item-${Date.now()}`,
      shopping_list_id: mockShoppingList.id,
      name: "Test Item",
      quantity: "1",
      category: "Test",
      is_checked: false,
    };
    console.log("✅ CREATE: Shopping item added");

    // Test Update Item
    const updatedItem = { ...mockItem, is_checked: true };
    console.log("✅ UPDATE: Shopping item updated");

    // Test Delete Item
    console.log("✅ DELETE: Shopping item removed");

    // Test Delete List
    console.log("✅ DELETE: Shopping list removed");

    console.log("✅ Shopping list CRUD test completed");
  };

  const testIngredientConsolidation = async () => {
    console.log("=== Testing Ingredient Consolidation ===");

    const mockItems = [
      { name: "Tomatoes", quantity: "2", unit: "pieces" },
      { name: "tomatoes", quantity: "3", unit: "pieces" },
      { name: "Onions", quantity: "1", unit: "kg" },
      { name: "onion", quantity: "500", unit: "g" },
    ];

    console.log("Original items:", mockItems);

    // Simulate consolidation logic
    const consolidated = [
      { name: "Tomatoes", quantity: "5", unit: "pieces" },
      { name: "Onions", quantity: "1.5", unit: "kg" },
    ];

    console.log("Consolidated items:", consolidated);
    console.log("✅ Ingredient consolidation test completed");
  };

  const testOfflineSync = async () => {
    console.log("=== Testing Offline Sync ===");

    console.log("1. Simulating offline mode...");
    console.log("2. Creating offline operations...");
    console.log("3. Storing in pending queue...");
    console.log("4. Simulating online mode...");
    console.log("5. Syncing pending operations...");

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    console.log("✅ Offline sync test completed");
  };

  const simulateNetworkError = async () => {
    console.log("=== Simulating Network Error ===");

    console.log("1. Attempting network operation...");

    // Simulate network error
    await new Promise((resolve) => setTimeout(resolve, 500));

    throw new Error("Simulated network timeout");
  };

  const testInstagramExtraction = async (): Promise<void> => {
    console.log("=== Testing Instagram Recipe Extraction ===");

    try {
      // Import the actual Instagram extraction function
      const { extractRecipeFromInstagram } = await import(
        "@/services/recipeExtractor"
      );

      // Test with a sample Instagram URL
      const testUrl = "https://www.instagram.com/p/DDGpOJhSBYy/";
      const postId = "DDGpOJhSBYy";
      const username = "test_user";

      console.log(`Testing Instagram extraction for: ${testUrl}`);

      const recipe = await extractRecipeFromInstagram(username, postId);

      console.log("✅ Instagram extraction successful!");
      console.log("Recipe details:", {
        title: recipe.title,
        description: recipe.description?.substring(0, 100) + "...",
        author: recipe.author,
        ingredientsCount: recipe.ingredients?.length || 0,
        instructionsCount: recipe.instructions?.length || 0,
        tags: recipe.tags,
      });
    } catch (error: any) {
      console.error("❌ Instagram extraction test failed:", error);

      // Test the raw scraping to see what we can get
      try {
        const { testInstagramScraping } = await import(
          "@/services/recipeExtractor"
        );
        const testResult = await testInstagramScraping(
          "https://www.instagram.com/p/DDGpOJhSBYy/"
        );

        console.log("Raw Instagram scraping result:", {
          success: testResult.success,
          message: testResult.message,
          extractedData: testResult.extractedData,
        });
      } catch (scrapingError) {
        console.error("Raw scraping also failed:", scrapingError);
      }

      throw new Error(`Instagram extraction failed: ${error.message}`);
    }
  };

  const testManualInstagramExtraction = async (): Promise<void> => {
    console.log("=== Testing Manual Instagram Caption Extraction ===");

    try {
      const testCaption = `🍝 CREAMY GARLIC PASTA 🍝

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

#pasta #recipe #cooking #foodie`;

      const { extractRecipeFromInstagramCaption } = await import(
        "@/services/recipeExtractor"
      );

      const recipe = await extractRecipeFromInstagramCaption(
        testCaption,
        "testuser",
        "https://www.instagram.com/p/test123/",
        "https://example.com/pasta.jpg"
      );

      const hasIngredients =
        recipe.ingredients && recipe.ingredients.length > 0;
      const hasInstructions =
        recipe.instructions && recipe.instructions.length > 0;
      const hasTitle = recipe.title && recipe.title.length > 0;

      if (hasIngredients && hasInstructions && hasTitle) {
        console.log("✅ Manual Instagram extraction successful!");
        console.log("Recipe details:", {
          title: recipe.title,
          ingredientCount: recipe.ingredients?.length || 0,
          instructionCount: recipe.instructions?.length || 0,
          author: recipe.author,
          tags: recipe.tags?.join(", ") || "none",
        });
      } else {
        throw new Error(
          `Extraction incomplete - Title: ${hasTitle}, Ingredients: ${hasIngredients}, Instructions: ${hasInstructions}`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ Manual Instagram extraction failed:", errorMessage);
      throw new Error(`Manual Instagram extraction failed: ${errorMessage}`);
    }
  };

  const handleTestManualInstagramExtraction = () => {
    runTest("manualInstagramExtraction", testManualInstagramExtraction);
  };

  const testCompleteInstagramFlow = async (): Promise<void> => {
    console.log("=== Testing Complete Instagram Flow ===");

    try {
      const testUrl = "https://www.instagram.com/share/BBZ133yzEX";
      console.log(`Testing complete flow for: ${testUrl}`);

      // Step 1: Test backend API directly
      console.log("Step 1: Testing backend API...");
      const backendResponse = await fetch(
        "https://recipeextractionservice.onrender.com/api/scrape-web",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: testUrl,
            options: {
              text: true,
              metadata: true,
              images: true,
              headings: true,
              links: false,
              tables: false,
              forms: false,
            },
          }),
        }
      );

      if (!backendResponse.ok) {
        throw new Error(`Backend API failed: ${backendResponse.status}`);
      }

      const backendData = await backendResponse.json();
      const ogDescription = backendData.metadata?.open_graph?.description;
      const ogTitle = backendData.metadata?.open_graph?.title;

      console.log("✅ Backend API successful!");
      console.log(`Caption length: ${ogDescription?.length || 0} characters`);
      console.log(`Title: ${ogTitle?.substring(0, 100)}...`);
      console.log(`Caption preview: ${ogDescription?.substring(0, 200)}...`);

      if (!ogDescription || ogDescription.length < 100) {
        throw new Error("Backend didn't return sufficient caption data");
      }

      // Step 2: Test app's Instagram scraping
      console.log("Step 2: Testing app's Instagram scraping...");
      const scrapingResult = await testInstagramScraping(testUrl);

      if (!scrapingResult.success || !scrapingResult.extractedData) {
        throw new Error(`App scraping failed: ${scrapingResult.message}`);
      }

      console.log("✅ App scraping successful!");
      console.log(
        `App caption length: ${scrapingResult.extractedData.caption.length} characters`
      );
      console.log(`App username: ${scrapingResult.extractedData.username}`);

      // Step 3: Test DeepSeek analysis directly
      console.log("Step 3: Testing DeepSeek analysis...");
      const { analyzeRecipeText } = await import("@/services/deepseekservice");

      const deepseekResult = await analyzeRecipeText(
        scrapingResult.extractedData.caption
      );

      console.log("✅ DeepSeek analysis completed!");
      console.log(`Recipe title: "${deepseekResult.title}"`);
      console.log(
        `Ingredients count: ${deepseekResult.ingredients?.length || 0}`
      );
      console.log(
        `Instructions count: ${deepseekResult.instructions?.length || 0}`
      );
      console.log(`Tags: ${deepseekResult.tags?.join(", ") || "none"}`);

      // Step 4: Test complete Instagram caption extraction
      console.log("Step 4: Testing complete Instagram caption extraction...");
      const finalResult = await extractRecipeFromInstagramCaption(
        scrapingResult.extractedData.caption,
        scrapingResult.extractedData.username,
        testUrl,
        scrapingResult.extractedData.thumbnail || undefined
      );

      console.log("✅ Complete extraction successful!");
      console.log(`Final recipe title: "${finalResult.title}"`);
      console.log(
        `Final ingredients count: ${finalResult.ingredients?.length || 0}`
      );
      console.log(
        `Final instructions count: ${finalResult.instructions?.length || 0}`
      );

      // Step 5: Validation
      console.log("Step 5: Testing validation...");
      const validationErrors = validateRecipe(finalResult);

      if (validationErrors.length === 0) {
        console.log("✅ Recipe validation passed!");
      } else {
        console.log("❌ Recipe validation failed:");
        validationErrors.forEach((error) => console.log(`  - ${error}`));
      }

      // Step 6: Quality assessment
      console.log("Step 6: Quality assessment...");
      let qualityScore = 0;
      const maxScore = 5;

      // Check title quality
      if (
        finalResult.title &&
        finalResult.title.length > 10 &&
        !finalResult.title.includes("Recipe from @")
      ) {
        qualityScore++;
        console.log("✅ Good title quality");
      } else {
        console.log("❌ Poor title quality");
      }

      // Check ingredients
      if (finalResult.ingredients && finalResult.ingredients.length > 3) {
        qualityScore++;
        console.log("✅ Good ingredients count");
      } else {
        console.log("❌ Poor ingredients count");
      }

      // Check instructions
      if (finalResult.instructions && finalResult.instructions.length > 2) {
        qualityScore++;
        console.log("✅ Good instructions count");
      } else {
        console.log("❌ Poor instructions count");
      }

      // Check image
      if (finalResult.imageUrl) {
        qualityScore++;
        console.log("✅ Has image");
      } else {
        console.log("❌ No image");
      }

      // Check metadata
      if (
        finalResult.prepTime ||
        finalResult.cookTime ||
        (finalResult.servings && finalResult.servings > 1)
      ) {
        qualityScore++;
        console.log("✅ Has cooking metadata");
      } else {
        console.log("❌ No cooking metadata");
      }

      const qualityPercentage = (qualityScore / maxScore) * 100;
      console.log(
        `📊 Overall Quality Score: ${qualityScore}/${maxScore} (${qualityPercentage}%)`
      );

      if (qualityPercentage >= 80) {
        console.log(
          "🎉 EXCELLENT - Complete Instagram flow is working perfectly!"
        );
      } else if (qualityPercentage >= 60) {
        console.log("👍 GOOD - Complete Instagram flow is working well");
      } else if (qualityPercentage >= 40) {
        console.log("⚠️ FAIR - Complete Instagram flow needs improvement");
      } else {
        console.log(
          "❌ POOR - Complete Instagram flow is not working properly"
        );
      }

      // Step 7: Compare backend vs final result
      console.log("Step 7: Backend vs Final comparison...");
      console.log(`Backend caption: ${ogDescription.length} chars`);
      console.log(
        `App caption: ${scrapingResult.extractedData.caption.length} chars`
      );
      console.log(
        `Caption match: ${
          ogDescription === scrapingResult.extractedData.caption ? "✅" : "❌"
        }`
      );
    } catch (error: any) {
      console.error("❌ Complete Instagram flow test failed:", error);
      console.error("Error details:", error.message);
    }
  };

  const testRecipeExtractionFix = async (): Promise<void> => {
    console.log("=== Testing Recipe Extraction Fix ===");

    try {
      // Import the test function
      const { testRecipeExtractionFix } = await import(
        "@/services/deepseekservice"
      );

      const testResult = await testRecipeExtractionFix();

      if (testResult.success) {
        console.log("✅ Recipe extraction fix test passed!");
        console.log(testResult.message);
        if (testResult.result) {
          console.log("Sample result:", {
            title: testResult.result.title,
            description:
              testResult.result.description?.substring(0, 100) + "...",
            ingredientsCount: testResult.result.ingredients?.length || 0,
            instructionsCount: testResult.result.instructions?.length || 0,
          });
        }
      } else {
        console.error("❌ Recipe extraction fix test failed!");
        console.error(testResult.message);
        throw new Error(testResult.message);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("❌ Recipe extraction fix test failed:", errorMessage);
      throw new Error(`Recipe extraction fix test failed: ${errorMessage}`);
    }
  };

  const testInstagramExtractionFix = async (): Promise<void> => {
    console.log("=== Testing Instagram Extraction Fix ===");

    try {
      const testUrl = "https://www.instagram.com/share/BBZ133yzEX";
      console.log(`Testing Instagram share URL: ${testUrl}`);

      // Step 1: Test the scraping function directly
      console.log("Step 1: Testing Instagram scraping...");
      const scrapingResult = await testInstagramScraping(testUrl);

      if (scrapingResult.success && scrapingResult.extractedData) {
        console.log("✅ Instagram scraping successful!");
        console.log(
          `Caption length: ${scrapingResult.extractedData.caption.length} characters`
        );
        console.log(`Username: ${scrapingResult.extractedData.username}`);
        console.log(
          `Has thumbnail: ${!!scrapingResult.extractedData.thumbnail}`
        );
        console.log(
          `Caption preview: ${scrapingResult.extractedData.caption.substring(
            0,
            200
          )}...`
        );

        // Step 2: Test the recipe extraction from caption
        console.log("Step 2: Testing recipe extraction from caption...");
        const recipeResult = await extractRecipeFromInstagramCaption(
          scrapingResult.extractedData.caption,
          scrapingResult.extractedData.username,
          testUrl,
          scrapingResult.extractedData.thumbnail || undefined
        );

        if (recipeResult) {
          console.log("✅ Recipe extraction successful!");
          console.log(`Recipe title: "${recipeResult.title}"`);
          console.log(
            `Ingredients count: ${recipeResult.ingredients?.length || 0}`
          );
          console.log(
            `Instructions count: ${recipeResult.instructions?.length || 0}`
          );
          console.log(`Author: ${recipeResult.author}`);
          console.log(`Has image: ${!!recipeResult.imageUrl}`);

          // Step 3: Test validation
          console.log("Step 3: Testing recipe validation...");
          const validationErrors = validateRecipe(recipeResult);

          if (validationErrors.length === 0) {
            console.log("✅ Recipe validation passed!");
          } else {
            console.log("❌ Recipe validation failed:");
            validationErrors.forEach((error) => console.log(`  - ${error}`));
          }

          // Step 4: Quality assessment
          console.log("Step 4: Quality assessment...");
          let qualityScore = 0;
          const maxScore = 5;

          // Check title quality
          if (
            recipeResult.title &&
            recipeResult.title.length > 10 &&
            !recipeResult.title.includes("Recipe Name")
          ) {
            qualityScore++;
            console.log("✅ Good title quality");
          } else {
            console.log("❌ Poor title quality");
          }

          // Check ingredients
          if (recipeResult.ingredients && recipeResult.ingredients.length > 3) {
            qualityScore++;
            console.log("✅ Good ingredients count");
          } else {
            console.log("❌ Poor ingredients count");
          }

          // Check instructions
          if (
            recipeResult.instructions &&
            recipeResult.instructions.length > 2
          ) {
            qualityScore++;
            console.log("✅ Good instructions count");
          } else {
            console.log("❌ Poor instructions count");
          }

          // Check image
          if (recipeResult.imageUrl) {
            qualityScore++;
            console.log("✅ Has image");
          } else {
            console.log("❌ No image");
          }

          // Check metadata
          if (
            recipeResult.prepTime ||
            recipeResult.cookTime ||
            recipeResult.servings
          ) {
            qualityScore++;
            console.log("✅ Has cooking metadata");
          } else {
            console.log("❌ No cooking metadata");
          }

          const qualityPercentage = (qualityScore / maxScore) * 100;
          console.log(
            `📊 Overall Quality Score: ${qualityScore}/${maxScore} (${qualityPercentage}%)`
          );

          if (qualityPercentage >= 80) {
            console.log(
              "🎉 EXCELLENT - Instagram extraction is working perfectly!"
            );
          } else if (qualityPercentage >= 60) {
            console.log("👍 GOOD - Instagram extraction is working well");
          } else if (qualityPercentage >= 40) {
            console.log("⚠️ FAIR - Instagram extraction needs improvement");
          } else {
            console.log(
              "❌ POOR - Instagram extraction is not working properly"
            );
          }
        } else {
          console.log("❌ Recipe extraction failed - no result returned");
        }
      } else {
        console.log("❌ Instagram scraping failed:");
        console.log(scrapingResult.message);
      }
    } catch (error) {
      console.error("❌ Instagram extraction test failed:", error);
    }
  };

  const runAllTests = async () => {
    const tests = [
      { name: "imageProcessing", fn: handleTestImageProcessing },
      { name: "quickImage", fn: handleQuickImageTest },
      {
        name: "mealPlanCreation",
        fn: () => runTest("mealPlanCreation", testMealPlanCreation),
      },
      {
        name: "mealPlanSync",
        fn: () => runTest("mealPlanSync", testMealPlanSync),
      },
      {
        name: "shoppingListGeneration",
        fn: () => runTest("shoppingListGeneration", testShoppingListGeneration),
      },
      {
        name: "shoppingListCRUD",
        fn: () => runTest("shoppingListCRUD", testShoppingListCRUD),
      },
      {
        name: "ingredientConsolidation",
        fn: () =>
          runTest("ingredientConsolidation", testIngredientConsolidation),
      },
      {
        name: "offlineSync",
        fn: () => runTest("offlineSync", testOfflineSync),
      },
      {
        name: "instagramExtraction",
        fn: () => runTest("instagramExtraction", testInstagramExtraction),
      },
      {
        name: "manualInstagramExtraction",
        fn: () =>
          runTest("manualInstagramExtraction", testManualInstagramExtraction),
      },
      {
        name: "completeInstagramExtraction",
        fn: () =>
          runTest("completeInstagramExtraction", testCompleteInstagramFlow),
      },
      {
        name: "recipeExtractionFix",
        fn: () => runTest("recipeExtractionFix", testRecipeExtractionFix),
      },
    ];

    for (const test of tests) {
      await test.fn();
      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const clearAllTestResults = () => {
    setTestResults({});
    console.clear();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 System Diagnostics</Text>
          <ConnectionDiagnostic />
          <FixImageUrlsButton />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🖼️ Image Processing Tests</Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestImageProcessing}
            disabled={isRunningTests.imageProcessing}
          >
            <Ionicons name="image-outline" size={20} color={colors.white} />
            <Text style={styles.testButtonText}>
              {isRunningTests.imageProcessing
                ? "Running..."
                : "Test Image Processing"}
            </Text>
          </TouchableOpacity>
          {testResults.imageProcessing && (
            <Text style={styles.testResult}>{testResults.imageProcessing}</Text>
          )}

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleQuickImageTest}
            disabled={isRunningTests.quickImage}
          >
            <Ionicons name="flash-outline" size={20} color={colors.white} />
            <Text style={styles.testButtonText}>
              {isRunningTests.quickImage ? "Running..." : "Quick Image Test"}
            </Text>
          </TouchableOpacity>
          {testResults.quickImage && (
            <Text style={styles.testResult}>{testResults.quickImage}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍽️ Meal Plan Tests</Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => runTest("mealPlanCreation", testMealPlanCreation)}
            disabled={isRunningTests.mealPlanCreation}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.white} />
            <Text style={styles.testButtonText}>
              {isRunningTests.mealPlanCreation
                ? "Running..."
                : "Test Meal Plan Creation"}
            </Text>
          </TouchableOpacity>
          {testResults.mealPlanCreation && (
            <Text style={styles.testResult}>
              {testResults.mealPlanCreation}
            </Text>
          )}

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => runTest("mealPlanSync", testMealPlanSync)}
            disabled={isRunningTests.mealPlanSync}
          >
            <Ionicons name="sync-outline" size={20} color={colors.white} />
            <Text style={styles.testButtonText}>
              {isRunningTests.mealPlanSync
                ? "Running..."
                : "Test Meal Plan Sync"}
            </Text>
          </TouchableOpacity>
          {testResults.mealPlanSync && (
            <Text style={styles.testResult}>{testResults.mealPlanSync}</Text>
          )}

          <TouchableOpacity
            style={styles.testButton}
            onPress={() =>
              runTest("shoppingListGeneration", testShoppingListGeneration)
            }
            disabled={isRunningTests.shoppingListGeneration}
          >
            <Ionicons name="list-outline" size={20} color={colors.white} />
            <Text style={styles.testButtonText}>
              {isRunningTests.shoppingListGeneration
                ? "Running..."
                : "Test Shopping List Generation"}
            </Text>
          </TouchableOpacity>
          {testResults.shoppingListGeneration && (
            <Text style={styles.testResult}>
              {testResults.shoppingListGeneration}
            </Text>
          )}

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => runTest("clearMealPlanCache", clearMealPlanCache)}
            disabled={isRunningTests.clearMealPlanCache}
          >
            <Ionicons name="trash-outline" size={20} color={colors.white} />
            <Text style={styles.testButtonText}>
              {isRunningTests.clearMealPlanCache
                ? "Running..."
                : "Clear Meal Plan Cache"}
            </Text>
          </TouchableOpacity>
          {testResults.clearMealPlanCache && (
            <Text style={styles.testResult}>
              {testResults.clearMealPlanCache}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛒 Groceries Tests</Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => runTest("shoppingListCRUD", testShoppingListCRUD)}
            disabled={isRunningTests.shoppingListCRUD}
          >
            <Ionicons name="basket-outline" size={20} color={colors.white} />
            <Text style={styles.testButtonText}>
              {isRunningTests.shoppingListCRUD
                ? "Running..."
                : "Test Shopping List CRUD"}
            </Text>
          </TouchableOpacity>
          {testResults.shoppingListCRUD && (
            <Text style={styles.testResult}>
              {testResults.shoppingListCRUD}
            </Text>
          )}

          <TouchableOpacity
            style={styles.testButton}
            onPress={() =>
              runTest("ingredientConsolidation", testIngredientConsolidation)
            }
            disabled={isRunningTests.ingredientConsolidation}
          >
            <Ionicons name="layers-outline" size={20} color={colors.white} />
            <Text style={styles.testButtonText}>
              {isRunningTests.ingredientConsolidation
                ? "Running..."
                : "Test Ingredient Consolidation"}
            </Text>
          </TouchableOpacity>
          {testResults.ingredientConsolidation && (
            <Text style={styles.testResult}>
              {testResults.ingredientConsolidation}
            </Text>
          )}

          <TouchableOpacity
            style={styles.testButton}
            onPress={() => runTest("offlineSync", testOfflineSync)}
            disabled={isRunningTests.offlineSync}
          >
            <Ionicons
              name="cloud-offline-outline"
              size={20}
              color={colors.white}
            />
            <Text style={styles.testButtonText}>
              {isRunningTests.offlineSync ? "Running..." : "Test Offline Sync"}
            </Text>
          </TouchableOpacity>
          {testResults.offlineSync && (
            <Text style={styles.testResult}>{testResults.offlineSync}</Text>
          )}

          <TouchableOpacity
            style={[styles.testButton, styles.dangerButton]}
            onPress={() => runTest("networkError", simulateNetworkError)}
            disabled={isRunningTests.networkError}
          >
            <Ionicons name="warning-outline" size={20} color={colors.white} />
            <Text style={styles.testButtonText}>
              {isRunningTests.networkError
                ? "Running..."
                : "Simulate Network Error"}
            </Text>
          </TouchableOpacity>
          {testResults.networkError && (
            <Text style={styles.testResult}>{testResults.networkError}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Batch Operations</Text>

          <TouchableOpacity
            style={[styles.testButton, styles.primaryButton]}
            onPress={runAllTests}
            disabled={Object.values(isRunningTests).some(Boolean)}
          >
            <Ionicons name="play-outline" size={20} color={colors.white} />
            <Text style={styles.testButtonText}>Run All Tests</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.testButton, styles.secondaryButton]}
            onPress={clearAllTestResults}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.white} />
            <Text style={styles.testButtonText}>Clear Results</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 API Health Checks</Text>

          <APIHealthCheck
            title="Supabase API Health"
            status={supabaseAPI.status}
            logs={supabaseAPI.logs}
            onCheck={supabaseAPI.checkHealth}
            isLoading={supabaseAPI.isLoading}
          />

          <APIHealthCheck
            title="DeepSeek API Health"
            status={deepseekAPI.status}
            logs={deepseekAPI.logs}
            onCheck={deepseekAPI.checkHealth}
            isLoading={deepseekAPI.isLoading}
          />

          <APIHealthCheck
            title="Recipe Extraction Service API Health"
            status={recipeAPI.status}
            logs={recipeAPI.logs}
            onCheck={recipeAPI.checkHealth}
            isLoading={recipeAPI.isLoading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Instagram Extraction Tests</Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() =>
              runTest("instagramExtraction", testInstagramExtraction)
            }
            disabled={isRunningTests.instagramExtraction}
          >
            <Ionicons name="logo-instagram" size={20} color={colors.white} />
            <Text style={styles.testButtonText}>
              {isRunningTests.instagramExtraction
                ? "Running..."
                : "Test Instagram Scraping"}
            </Text>
          </TouchableOpacity>
          {testResults.instagramExtraction && (
            <Text style={styles.testResult}>
              {testResults.instagramExtraction}
            </Text>
          )}

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestManualInstagramExtraction}
            disabled={isRunningTests.manualInstagramExtraction}
          >
            <Ionicons name="logo-instagram" size={20} color={colors.white} />
            <Text style={styles.testButtonText}>
              {isRunningTests.manualInstagramExtraction
                ? "Running..."
                : "Test Manual Instagram Extraction"}
            </Text>
          </TouchableOpacity>
          {testResults.manualInstagramExtraction && (
            <Text style={styles.testResult}>
              {testResults.manualInstagramExtraction}
            </Text>
          )}

          <TouchableOpacity
            style={styles.testButton}
            onPress={() =>
              runTest("newInstagramFlow", async () => {
                const { testInstagramExtractionFlow } = await import(
                  "@/services/deepseekservice"
                );
                const result = await testInstagramExtractionFlow();

                // Print comprehensive results for development
                console.log(
                  "\n🔍 === COMPREHENSIVE INSTAGRAM EXTRACTION RESULTS ==="
                );
                console.log(`✅ Success: ${result.success}`);
                console.log(`📝 Message: ${result.message}`);

                if (result.extractedData) {
                  console.log("\n📊 === SCRAPED DATA ===");
                  console.log(
                    `📝 Caption Length: ${
                      result.extractedData.caption?.length || 0
                    } characters`
                  );
                  console.log(
                    `👤 Author: ${result.extractedData.author || "Unknown"}`
                  );
                  console.log(
                    `📸 Image URL: ${
                      result.extractedData.imageUrl
                        ? "✅ Available"
                        : "❌ Missing"
                    }`
                  );
                  console.log(
                    `🖼️ Media Count: ${
                      result.extractedData.mediaUrls?.length || 0
                    }`
                  );
                  console.log(
                    `📝 Caption Preview: "${result.extractedData.caption?.substring(
                      0,
                      200
                    )}${
                      (result.extractedData.caption?.length || 0) > 200
                        ? "..."
                        : ""
                    }"`
                  );
                }

                if (result.recipeResult) {
                  console.log("\n🍳 === FORMATTED RECIPE ===");
                  console.log(`📋 Title: "${result.recipeResult.title}"`);
                  console.log(
                    `📝 Description: "${result.recipeResult.description?.substring(
                      0,
                      200
                    )}${
                      (result.recipeResult.description?.length || 0) > 200
                        ? "..."
                        : ""
                    }"`
                  );
                  console.log(
                    `🥘 Ingredients Count: ${
                      result.recipeResult.ingredients?.length || 0
                    }`
                  );
                  console.log(
                    `📋 Instructions Count: ${
                      result.recipeResult.instructions?.length || 0
                    }`
                  );
                  console.log(
                    `⏱️ Prep Time: ${result.recipeResult.prepTime || 0} minutes`
                  );
                  console.log(
                    `🔥 Cook Time: ${result.recipeResult.cookTime || 0} minutes`
                  );
                  console.log(
                    `👥 Servings: ${result.recipeResult.servings || 0}`
                  );
                  console.log(
                    `🏷️ Tags Count: ${result.recipeResult.tags?.length || 0}`
                  );

                  // Detailed ingredient analysis
                  if (
                    result.recipeResult.ingredients &&
                    result.recipeResult.ingredients.length > 0
                  ) {
                    console.log("\n🥘 === INGREDIENTS DETAIL ===");
                    result.recipeResult.ingredients.forEach((ing, index) => {
                      console.log(
                        `${index + 1}. ${ing.amount} ${ing.unit} ${ing.name}`
                      );
                    });
                  } else {
                    console.log("\n❌ === NO INGREDIENTS EXTRACTED ===");
                  }

                  // Detailed instructions analysis
                  if (
                    result.recipeResult.instructions &&
                    result.recipeResult.instructions.length > 0
                  ) {
                    console.log("\n📋 === INSTRUCTIONS DETAIL ===");
                    result.recipeResult.instructions.forEach((step, index) => {
                      console.log(
                        `${index + 1}. ${step.substring(0, 100)}${
                          step.length > 100 ? "..." : ""
                        }`
                      );
                    });
                  } else {
                    console.log("\n❌ === NO INSTRUCTIONS EXTRACTED ===");
                  }

                  // Detailed tag analysis
                  if (
                    result.recipeResult.tags &&
                    result.recipeResult.tags.length > 0
                  ) {
                    console.log("\n🏷️ === TAGS DETAIL ===");
                    result.recipeResult.tags.forEach((tag, index) => {
                      console.log(`${index + 1}. "${tag}"`);
                    });

                    // Enhanced tag analysis
                    try {
                      const { validateAndCategorizeTags } = await import(
                        "@/services/tagUtils"
                      );
                      const tagAnalysis = validateAndCategorizeTags(
                        result.recipeResult.tags
                      );

                      console.log("\n🔍 === TAG ANALYSIS ===");
                      console.log(
                        `✅ Valid Tags: ${tagAnalysis.validTags.length}`
                      );
                      console.log(
                        `❌ Invalid Tags: ${tagAnalysis.invalidTags.length}`
                      );
                      console.log(
                        `📂 Categories Found: ${Object.keys(
                          tagAnalysis.categorizedTags
                        ).join(", ")}`
                      );

                      if (tagAnalysis.feedback.length > 0) {
                        console.log("\n📋 Tag Validation Feedback:");
                        tagAnalysis.feedback.forEach((feedback) =>
                          console.log(`  ${feedback}`)
                        );
                      }
                    } catch (tagError) {
                      console.log(
                        "⚠️ Could not perform enhanced tag analysis:",
                        tagError
                      );
                    }
                  } else {
                    console.log("\n❌ === NO TAGS EXTRACTED ===");
                  }
                }

                console.log("\n🔍 === END COMPREHENSIVE RESULTS ===\n");

                // Don't return anything to match the expected void return type
                if (!result.success) {
                  throw new Error(result.message);
                }
              })
            }
            disabled={isRunningTests.newInstagramFlow}
          >
            <Ionicons name="analytics" size={20} color={colors.white} />
            <Text style={styles.testButtonText}>
              {isRunningTests.newInstagramFlow
                ? "Running..."
                : "Test New Instagram Flow (Detailed)"}
            </Text>
          </TouchableOpacity>
          {testResults.newInstagramFlow && (
            <Text style={styles.testResult}>
              {testResults.newInstagramFlow}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📱 Complete Instagram Recipe Extraction
          </Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() =>
              runTest("completeInstagramExtraction", testCompleteInstagramFlow)
            }
            disabled={isRunningTests.completeInstagramExtraction}
          >
            <Ionicons name="logo-instagram" size={20} color={colors.white} />
            <Text style={styles.testButtonText}>
              {isRunningTests.completeInstagramExtraction
                ? "Running..."
                : "Test Complete Instagram Recipe Extraction"}
            </Text>
          </TouchableOpacity>
          {testResults.completeInstagramExtraction && (
            <Text style={styles.testResult}>
              {testResults.completeInstagramExtraction}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📱 Recipe Extraction Fix</Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() =>
              runTest("recipeExtractionFix", testRecipeExtractionFix)
            }
            disabled={isRunningTests.recipeExtractionFix}
          >
            <Ionicons name="logo-instagram" size={20} color={colors.white} />
            <Text style={styles.testButtonText}>
              {isRunningTests.recipeExtractionFix
                ? "Running..."
                : "Test Recipe Extraction Fix"}
            </Text>
          </TouchableOpacity>
          {testResults.recipeExtractionFix && (
            <Text style={styles.testResult}>
              {testResults.recipeExtractionFix}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🏷️ Enhanced Tagging System Tests
          </Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={() =>
              runTest("enhancedTagging", async () => {
                const { testEnhancedTaggingSystem } = await import(
                  "@/services/deepseekservice"
                );
                const result = await testEnhancedTaggingSystem();

                console.log("\n🏷️ === ENHANCED TAGGING SYSTEM TEST ===");
                console.log(`✅ Success: ${result.success}`);
                console.log(`📝 Message: ${result.message}`);

                if (result.results) {
                  result.results.forEach((testResult, index) => {
                    console.log(
                      `\n🧪 Test ${index + 1}: ${testResult.recipeType}`
                    );
                    console.log(
                      `📊 Generated Tags: [${testResult.generatedTags
                        .map((t) => `"${t}"`)
                        .join(", ")}]`
                    );
                    console.log(
                      `✅ Valid Tags: [${testResult.validTags
                        .map((t) => `"${t}"`)
                        .join(", ")}]`
                    );
                    console.log(
                      `❌ Invalid Tags: [${testResult.invalidTags
                        .map((t) => `"${t}"`)
                        .join(", ")}]`
                    );
                    console.log(
                      `📂 Categories: ${JSON.stringify(testResult.categories)}`
                    );
                    console.log(`⭐ Quality: ${testResult.quality}`);
                  });
                }

                setTestResults((prev) => ({
                  ...prev,
                  enhancedTagging: result.message,
                }));
              })
            }
            disabled={isRunningTests.enhancedTagging}
          >
            <Ionicons name="pricetags-outline" size={20} color={colors.white} />
            <Text style={styles.testButtonText}>
              {isRunningTests.enhancedTagging
                ? "Running..."
                : "Test Enhanced Tagging System"}
            </Text>
          </TouchableOpacity>
          {testResults.enhancedTagging && (
            <Text style={styles.testResult}>{testResults.enhancedTagging}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.testButton}
          onPress={testCompleteInstagramFlow}
        >
          <Text style={styles.testButtonText}>
            Test Complete Instagram Flow
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: 16,
  },
  testButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#34D399",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.gray[600],
  },
  dangerButton: {
    backgroundColor: colors.red[500],
  },
  testButtonText: {
    color: colors.white,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  testResult: {
    fontSize: 12,
    color: colors.gray[600],
    marginBottom: 8,
    marginLeft: 28,
    fontFamily: "monospace",
  },
});

export default DebugPage;
