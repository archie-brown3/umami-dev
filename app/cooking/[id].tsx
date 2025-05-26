import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, borderRadius } from "@/utils/styleUtils";
import { Recipe } from "@/types";
import { getRecipeWithDetails } from "@/services/recipeService";
import { RecipeCard } from "@/components/recipes/RecipeCard";

const { width } = Dimensions.get("window");

export default function CookingScreen() {
  const { id } = useLocalSearchParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const recipeId = Array.isArray(id) ? id[0] : id;

  useEffect(() => {
    fetchRecipe();
  }, [recipeId]);

  const fetchRecipe = async () => {
    try {
      const recipeData = await getRecipeWithDetails(recipeId as string);
      setRecipe(recipeData);
    } catch (error) {
      console.error("Error fetching recipe:", error);
      Alert.alert("Error", "Failed to load recipe");
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (!recipe) return;

    const newCompletedSteps = new Set(completedSteps);
    newCompletedSteps.add(currentStep);
    setCompletedSteps(newCompletedSteps);

    if (currentStep < recipe.instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepSelect = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleFinishCooking = () => {
    router.replace("/");
  };

  const highlightText = (text: string) => {
    // Highlight temperatures, times, and ingredients
    const temperatureRegex = /(\d+°[CF]|\d+\s*degrees?)/gi;
    const timeRegex = /(\d+\s*(?:minutes?|mins?|hours?|hrs?|seconds?|secs?))/gi;
    const ingredientRegex = new RegExp(
      `(${recipe?.ingredients.map((ing) => ing.name).join("|")})`,
      "gi"
    );

    return text
      .replace(temperatureRegex, "<temp>$1</temp>")
      .replace(timeRegex, "<time>$1</time>")
      .replace(ingredientRegex, "<ingredient>$1</ingredient>");
  };

  const renderHighlightedText = (text: string) => {
    const highlighted = highlightText(text);
    const parts = highlighted.split(
      /(<temp>.*?<\/temp>|<time>.*?<\/time>|<ingredient>.*?<\/ingredient>)/
    );

    return (
      <Text style={styles.instructionText}>
        {parts.map((part, index) => {
          if (part.startsWith("<temp>")) {
            return (
              <Text key={index} style={styles.temperatureText}>
                {part.replace(/<\/?temp>/g, "")}
              </Text>
            );
          } else if (part.startsWith("<time>")) {
            return (
              <Text key={index} style={styles.timeText}>
                {part.replace(/<\/?time>/g, "")}
              </Text>
            );
          } else if (part.startsWith("<ingredient>")) {
            return (
              <Text key={index} style={styles.ingredientText}>
                {part.replace(/<\/?ingredient>/g, "")}
              </Text>
            );
          }
          return part;
        })}
      </Text>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading recipe...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Recipe not found</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.completionContainer}>
          <View style={styles.completionContent}>
            <Ionicons
              name="checkmark-circle"
              size={80}
              color={colors.green[500]}
            />
            <Text style={styles.completionTitle}>Recipe Complete!</Text>
            <Text style={styles.completionSubtitle}>
              Great job cooking {recipe.title}
            </Text>

            <View style={styles.recipeCardContainer}>
              <RecipeCard recipe={recipe} />
            </View>

            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleFinishCooking}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const progress = ((currentStep + 1) / recipe.instructions.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cooking Mode</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setIsCompleted(true)}
        >
          <Ionicons name="checkmark" size={24} color={colors.dark} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {recipe.instructions.length}
        </Text>
      </View>

      {/* Recipe Info */}
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeTitle}>{recipe.title}</Text>
        <View style={styles.recipeMetadata}>
          <Text style={styles.metadataText}>
            <Ionicons name="people" size={14} color={colors.gray[600]} />{" "}
            {recipe.servings} servings
          </Text>
          <Text style={styles.metadataText}>
            <Ionicons name="time" size={14} color={colors.gray[600]} />{" "}
            {(recipe.prepTime || 0) + (recipe.cookTime || 0)} min
          </Text>
        </View>
      </View>

      {/* Ingredients Panel */}
      <View style={styles.ingredientsPanel}>
        <Text style={styles.ingredientsPanelTitle}>Ingredients</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recipe.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.ingredientChip}>
              <Text style={styles.ingredientChipText}>
                {ingredient.amount} {ingredient.unit} {ingredient.name}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Current Step */}
      <ScrollView
        style={styles.stepContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepContent}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepNumber}>Step {currentStep + 1}</Text>
            {completedSteps.has(currentStep) && (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color={colors.green[500]}
              />
            )}
          </View>

          {renderHighlightedText(recipe.instructions[currentStep])}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            currentStep === 0 && styles.navButtonDisabled,
          ]}
          onPress={handlePreviousStep}
          disabled={currentStep === 0}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={currentStep === 0 ? colors.gray[400] : colors.white}
          />
          <Text
            style={[
              styles.navButtonText,
              currentStep === 0 && styles.navButtonTextDisabled,
            ]}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
          <Text style={styles.nextButtonText}>
            {currentStep === recipe.instructions.length - 1
              ? "Finish"
              : "Next Step"}
          </Text>
          <Ionicons name="chevron-forward" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: colors.gray[600],
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  errorText: {
    fontSize: 18,
    color: colors.red[500],
    marginBottom: spacing.lg,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerButton: {
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.gray[100],
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.dark,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.gray[200],
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: colors.gray[600],
    textAlign: "center",
    fontWeight: "500",
  },
  recipeInfo: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  recipeMetadata: {
    flexDirection: "row",
    gap: spacing.lg,
  },
  metadataText: {
    fontSize: 14,
    color: colors.gray[600],
    alignItems: "center",
  },
  ingredientsPanel: {
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  ingredientsPanelTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  ingredientChip: {
    backgroundColor: colors.blue[50],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginLeft: spacing.lg,
    marginRight: spacing.xs,
  },
  ingredientChipText: {
    fontSize: 12,
    color: colors.blue[500],
    fontWeight: "500",
  },
  stepContainer: {
    flex: 1,
  },
  stepContent: {
    padding: spacing.xl,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  stepNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
  },
  instructionText: {
    fontSize: 18,
    lineHeight: 28,
    color: colors.dark,
  },
  temperatureText: {
    backgroundColor: colors.orange[500],
    color: colors.white,
    fontWeight: "600",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  timeText: {
    backgroundColor: colors.blue[50],
    color: colors.blue[500],
    fontWeight: "600",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  ingredientText: {
    backgroundColor: colors.green[500],
    color: colors.white,
    fontWeight: "600",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  navigationContainer: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    gap: spacing.md,
  },
  navButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gray[600],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  navButtonDisabled: {
    backgroundColor: colors.gray[200],
  },
  navButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  navButtonTextDisabled: {
    color: colors.gray[400],
  },
  nextButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  nextButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginRight: spacing.sm,
  },
  completionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.white,
  },
  completionContent: {
    alignItems: "center",
    maxWidth: 300,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.dark,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  completionSubtitle: {
    fontSize: 16,
    color: colors.gray[600],
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  recipeCardContainer: {
    width: width - spacing.xl * 2,
    marginBottom: spacing.xl,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    minWidth: 200,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
});
