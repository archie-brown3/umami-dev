import React from "react";
import { format } from "date-fns";
import { useRecipes } from "../context/RecipeContext";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Plus, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TodaysMealPlan = () => {
  const navigate = useNavigate();
  const { mealPlan, getRecipeById } = useRecipes();

  // Get today's date in the format used by the meal plan
  const today = format(new Date(), "yyyy-MM-dd");

  // Get meals for today
  const todaysMeals = mealPlan.dayMeals?.[today] || {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
  };

  // Check if we have any meals today
  const hasMealsToday = Object.values(todaysMeals).some(
    (meals) => meals.length > 0
  );

  const mealTypes = [
    { id: "breakfast", label: "Breakfast", emoji: "🍳" },
    { id: "lunch", label: "Lunch", emoji: "🥪" },
    { id: "dinner", label: "Dinner", emoji: "🍝" },
    { id: "snacks", label: "Snacks", emoji: "🍎" },
  ];

  const handleViewMealPlan = () => {
    navigate("/meal-plan");
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Today's Meals</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleViewMealPlan}
          className="text-xs flex items-center gap-1"
        >
          View All
          <ChevronRight className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent>
        {hasMealsToday ? (
          <div className="space-y-3">
            {mealTypes.map((mealType) => {
              const mealRecipes =
                todaysMeals[mealType.id as keyof typeof todaysMeals] || [];

              if (mealRecipes.length === 0) {
                return null;
              }

              return (
                <div
                  key={mealType.id}
                  className="border-b pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-center mb-2">
                    <span className="mr-2">{mealType.emoji}</span>
                    <h3 className="text-sm font-medium">{mealType.label}</h3>
                  </div>

                  <div className="space-y-2">
                    {mealRecipes.map((recipeId) => {
                      const recipe = getRecipeById(recipeId);

                      if (!recipe) return null;

                      return (
                        <div
                          key={recipeId}
                          className="flex items-center p-2 bg-muted/30 rounded-md hover:bg-muted/50 cursor-pointer"
                          onClick={() => navigate(`/recipes/${recipeId}`)}
                        >
                          {recipe.imageUrl ? (
                            <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 mr-3">
                              <img
                                src={recipe.imageUrl}
                                alt={recipe.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    recipe.title
                                  )}&size=40&background=random`;
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mr-3">
                              {mealType.emoji}
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">
                              {recipe.title}
                            </h4>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <span>
                                {recipe.prepTime + recipe.cookTime} min
                              </span>
                            </div>
                          </div>

                          <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="bg-muted/30 p-3 rounded-full">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                No meals planned for today
              </p>
              <Button
                variant="default"
                size="sm"
                className="mt-3"
                onClick={handleViewMealPlan}
              >
                Plan Today's Meals
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodaysMealPlan;
