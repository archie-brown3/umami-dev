import React from "react";
import { format } from "date-fns";
import { useRecipes } from "../../context/RecipeContext";
import { Recipe } from "../../types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { View, Text, Image, TouchableOpacity } from "react-native";
// import { Plus, ChevronRight } from "lucide-react"; // TODO: Replace with @expo/vector-icons
// import { useNavigate } from "react-router-dom"; // TODO: Replace with Expo Router navigation

interface MealPlan {
  [date: string]: {
    [mealType: string]: string[];
  };
}

interface RecipeContextType {
  mealPlan: MealPlan;
  getRecipeById: (id: string) => Recipe | undefined;
}

const TodaysMealPlan: React.FC = () => {
  const { mealPlan, getRecipeById } = useRecipes();

  // Get today's date in the format used by the meal plan
  const today = format(new Date(), "yyyy-MM-dd");

  // Get today's meals from the meal plan
  const todaysMeals = mealPlan[today] || {};

  // Check if we have any meals today
  const hasMealsToday = Object.values(todaysMeals).some(
    (meals: string[]) => meals.length > 0
  );

  const mealTypes = [
    { id: "breakfast", label: "Breakfast" },
    { id: "lunch", label: "Lunch" },
    { id: "dinner", label: "Dinner" },
    { id: "snacks", label: "Snacks" },
  ];

  const handleViewMealPlan = () => {
    // Implement navigation to full meal plan view
    console.log("View full meal plan");
  };

  if (!hasMealsToday) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Meals</CardTitle>
        </CardHeader>
        <CardContent>
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <Text style={{ color: "#6B7280", marginBottom: 16 }}>
              No meals planned for today.
            </Text>
            <Button onPress={handleViewMealPlan}>Plan Your Meals</Button>
          </View>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <CardTitle>Today's Meals</CardTitle>
          <Button variant="ghost" onPress={handleViewMealPlan}>
            View Full Plan
          </Button>
        </View>
      </CardHeader>
      <CardContent>
        <View style={{ gap: 16 }}>
          {mealTypes.map((mealType) => {
            const mealRecipes = todaysMeals[mealType.id] || [];

            if (mealRecipes.length === 0) return null;

            return (
              <View key={mealType.id} style={{ gap: 8 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: "500", color: "#6B7280" }}
                >
                  {mealType.label}
                </Text>
                <View style={{ gap: 8 }}>
                  {mealRecipes.map((recipeId: string) => {
                    const recipe = getRecipeById(recipeId);

                    if (!recipe) return null;

                    return (
                      <TouchableOpacity
                        key={recipeId}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          padding: 8,
                          backgroundColor: "rgba(243, 244, 246, 0.3)",
                          borderRadius: 6,
                        }}
                      >
                        {recipe.imageUrl && (
                          <Image
                            source={{ uri: recipe.imageUrl }}
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 6,
                            }}
                          />
                        )}
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "500",
                            }}
                            numberOfLines={1}
                          >
                            {recipe.title}
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#6B7280",
                            }}
                          >
                            {recipe.prepTime + recipe.cookTime} mins
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </CardContent>
    </Card>
  );
};

export default TodaysMealPlan;
