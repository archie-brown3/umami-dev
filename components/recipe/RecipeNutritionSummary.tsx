import React, { useState, useEffect } from "react";
import { NutritionDisplay } from "./NutritionDisplay";
import {
  calculateRecipeNutrition,
  MacronutrientData,
} from "@/services/nutrition";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Loader2 } from "lucide-react";

interface RecipeIngredient {
  name: string;
  amount: number;
  unit: string;
  ingredientDetails?: any;
}

interface RecipeNutritionSummaryProps {
  ingredients?: RecipeIngredient[];
  nutritionData?: any;
  servings?: number;
  className?: string;
  compact?: boolean;
  topContributingIngredients?: Array<{ name: string; calories: number }>;
}

export const RecipeNutritionSummary: React.FC<RecipeNutritionSummaryProps> = ({
  ingredients,
  nutritionData: propNutritionData,
  servings = 1,
  className = "",
  compact = false,
  topContributingIngredients = [],
}) => {
  const [nutritionData, setNutritionData] = useState<any | null>(
    propNutritionData || null
  );
  const [isLoading, setIsLoading] = useState(
    !propNutritionData && !!ingredients?.length
  );
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "summary" | "macros" | "chart" | "contributors"
  >("summary");

  useEffect(() => {
    // If nutrition data is provided directly, use it
    if (propNutritionData) {
      setNutritionData(propNutritionData);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Otherwise calculate from ingredients
    if (!ingredients?.length) {
      setNutritionData(null);
      setError("No ingredients provided");
      return;
    }

    // Filter out ingredients with missing data
    const validIngredients = ingredients.filter(
      (ing) => ing.name && ing.amount && ing.unit && ing.ingredientDetails
    );

    if (validIngredients.length === 0) {
      setNutritionData(null);
      setError("No valid ingredients with complete data");
      return;
    }

    const fetchNutrition = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await calculateRecipeNutrition(validIngredients, servings);
        setNutritionData(data);
      } catch (error) {
        console.error("Error calculating recipe nutrition:", error);
        setError("Failed to calculate nutrition information");
        setNutritionData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNutrition();
  }, [ingredients, servings, propNutritionData]);

  useEffect(() => {
    if (nutritionData) {
      console.log(
        `Nutrition calculation: ${nutritionData.calories} calories per serving (${servings} servings)`
      );
    }
  }, [nutritionData, servings]);

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-gray-600">Calculating nutrition...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center text-gray-500 py-4 ${className}`}>
        {error}
      </div>
    );
  }

  if (!nutritionData) {
    return null;
  }

  // Prepare macro data for visualization
  const macroData: MacronutrientData = {
    calories: nutritionData.calories,
    protein:
      nutritionData.nutrients.find((n: any) => n.name === "Protein")?.amount ||
      0,
    carbs:
      nutritionData.nutrients.find((n: any) => n.name === "Carbohydrates")
        ?.amount || 0,
    fat:
      nutritionData.nutrients.find((n: any) => n.name === "Fat")?.amount || 0,
    fiber:
      nutritionData.nutrients.find((n: any) => n.name === "Fiber")?.amount || 0,
  };

  // Calculate calories from each macronutrient
  const proteinCalories = macroData.protein * 4;
  const carbsCalories = macroData.carbs * 4;
  const fatCalories = macroData.fat * 9;

  // Prepare data for the macronutrient distribution pie chart
  const pieData = [
    { name: "Protein", value: proteinCalories, color: "#8AB39F" },
    { name: "Carbs", value: carbsCalories, color: "#D4E4F0" },
    { name: "Fat", value: fatCalories, color: "#F08C75" },
  ];

  // Prepare data for the bar chart
  const mainNutrients = [
    { name: "Protein", amount: macroData.protein, unit: "g", color: "#8AB39F" },
    { name: "Carbs", amount: macroData.carbs, unit: "g", color: "#D4E4F0" },
    { name: "Fat", amount: macroData.fat, unit: "g", color: "#F08C75" },
    { name: "Fiber", amount: macroData.fiber, unit: "g", color: "#935E4C" },
  ];

  // Format amounts
  const formatAmount = (amount: number): string => {
    return amount < 10 ? amount.toFixed(1) : Math.round(amount).toString();
  };

  // Find top contributing ingredients if not provided explicitly
  const contributingIngredients =
    topContributingIngredients.length > 0
      ? topContributingIngredients
      : ingredients && ingredients.length > 0
      ? ingredients
          .filter((ing) => ing.name && ing.amount)
          .slice(0, 5)
          .map((ing) => ({
            name: ing.name,
            calories: 0, // We don't have individual calorie data, so using zero
          }))
      : [];

  if (compact && nutritionData) {
    // Find main nutrient values
    const protein =
      nutritionData.nutrients.find((n: any) => n.name === "Protein")?.amount ||
      0;
    const carbs =
      nutritionData.nutrients.find((n: any) => n.name === "Carbohydrates")
        ?.amount || 0;
    const fat =
      nutritionData.nutrients.find((n: any) => n.name === "Fat")?.amount || 0;
    const fiber =
      nutritionData.nutrients.find((n: any) => n.name === "Fiber")?.amount || 0;
    const calories = nutritionData.calories || 0;

    // Calculate total recipe calories
    const totalRecipeCalories = calories * servings;

    // Calculate calorie percentage of daily value (based on 2000 calorie diet)
    const caloriePercentage = Math.min(
      Math.round((calories / 2000) * 100),
      100
    );

    // Calculate macronutrient ratios
    const totalMacroWeight = protein + carbs + fat;
    const proteinPercentage =
      Math.round((protein / totalMacroWeight) * 100) || 0;
    const carbsPercentage = Math.round((carbs / totalMacroWeight) * 100) || 0;
    const fatPercentage = Math.round((fat / totalMacroWeight) * 100) || 0;

    return (
      <div
        className={`bg-[hsl(var(--card))] rounded-lg shadow-sm p-4 ${className}`}
      >
        <div className="flex flex-col mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-lg font-semibold">
              {Math.round(calories)} calories
            </span>
            <span className="text-sm text-muted-foreground">Per serving</span>
          </div>

          {servings > 1 && (
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Total recipe:</span>
              <span>{Math.round(totalRecipeCalories)} calories</span>
            </div>
          )}

          {/* Calorie progress bar */}
          <div className="w-full bg-[hsl(var(--muted))] rounded-full h-2.5 mt-1">
            <div
              className="bg-recipe-green h-2.5 rounded-full"
              style={{ width: `${caloriePercentage}%` }}
              title={`${caloriePercentage}% of daily value (2000 cal diet)`}
            ></div>
          </div>
          <span className="text-xs text-muted-foreground mt-1">
            {caloriePercentage}% of daily value
          </span>
        </div>

        {/* Macronutrient bars with legend */}
        <div className="mb-3">
          <div className="flex items-center h-4 rounded-md overflow-hidden">
            <div
              className="h-full bg-recipe-green"
              style={{ width: `${proteinPercentage}%` }}
              title={`Protein: ${proteinPercentage}%`}
            ></div>
            <div
              className="h-full bg-recipe-blue"
              style={{ width: `${carbsPercentage}%` }}
              title={`Carbs: ${carbsPercentage}%`}
            ></div>
            <div
              className="h-full bg-recipe-orange"
              style={{ width: `${fatPercentage}%` }}
              title={`Fat: ${fatPercentage}%`}
            ></div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-3 mt-2 text-xs">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-recipe-green rounded mr-1"></div>
              <span>Protein</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-recipe-blue rounded mr-1"></div>
              <span>Carbs</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-recipe-orange rounded mr-1"></div>
              <span>Fat</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center bg-[hsl(var(--info))] p-2 rounded-md">
          <div>
            <p className="text-xs text-[hsl(var(--info-foreground))]">
              Protein
            </p>
            <p className="text-sm font-medium">{formatAmount(protein)}g</p>
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--info-foreground))]">Carbs</p>
            <p className="text-sm font-medium">{formatAmount(carbs)}g</p>
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--info-foreground))]">Fat</p>
            <p className="text-sm font-medium">{formatAmount(fat)}g</p>
          </div>
          <div>
            <p className="text-xs text-[hsl(var(--info-foreground))]">Fiber</p>
            <p className="text-sm font-medium">{formatAmount(fiber)}g</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-[hsl(var(--card))] rounded-lg shadow-sm p-4 ${className}`}
    >
      <h3 className="text-lg font-semibold mb-4">Nutrition Facts</h3>

      {/* Tabs */}
      <div className="flex border-b mb-4 overflow-x-auto">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "summary"
              ? "border-b-2 border-recipe-green text-recipe-green"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("summary")}
        >
          Summary
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "macros"
              ? "border-b-2 border-recipe-orange text-recipe-orange"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("macros")}
        >
          Macros
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "chart"
              ? "border-b-2 border-recipe-terracotta text-recipe-terracotta"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("chart")}
        >
          Chart
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "contributors"
              ? "border-b-2 border-recipe-blue text-recipe-blue"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("contributors")}
        >
          Contributors
        </button>
      </div>

      {/* Add the new tab content - Top Contributors */}
      {activeTab === "contributors" && (
        <div>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Top Calorie Contributors
            </p>
            {ingredients && ingredients.length > 0 ? (
              <div className="space-y-3">
                {topContributingIngredients.length > 0
                  ? topContributingIngredients.map((ingredient, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b pb-2"
                      >
                        <span className="text-sm">{ingredient.name}</span>
                        <div className="flex items-center">
                          {/* Visual indicator of calorie contribution */}
                          <div className="flex mr-2">
                            {Array.from({
                              length: Math.min(5, ingredient.calories),
                            }).map((_, i) => (
                              <div
                                key={i}
                                className="w-1.5 h-6 mx-px rounded-sm bg-recipe-green"
                                style={{
                                  opacity: 1 - i * 0.15,
                                  height: `${1.2 + i * 0.2}rem`,
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">
                            {index === 0
                              ? "High"
                              : index < 3
                              ? "Medium"
                              : "Low"}
                          </span>
                        </div>
                      </div>
                    ))
                  : ingredients.slice(0, 5).map((ingredient, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b pb-2"
                      >
                        <span className="text-sm">{ingredient.name}</span>
                        <span className="text-sm font-medium">
                          {/* Estimated based on common ingredient types */}
                          {ingredient.name.toLowerCase().includes("oil") ||
                          ingredient.name.toLowerCase().includes("butter") ||
                          ingredient.name.toLowerCase().includes("cheese")
                            ? "High"
                            : ingredient.name.toLowerCase().includes("sugar") ||
                              ingredient.name.toLowerCase().includes("pasta") ||
                              ingredient.name.toLowerCase().includes("rice")
                            ? "Medium"
                            : "Low"}
                        </span>
                      </div>
                    ))}
                <div className="text-xs text-muted-foreground pt-2">
                  <p className="mb-1">
                    Contribution levels are estimated based on ingredient types
                    and quantities.
                  </p>
                  <p>
                    <span className="font-medium text-recipe-green">Note:</span>{" "}
                    Since your Spoonacular API key needs renewal, we're showing
                    estimates based on common nutritional values. For exact
                    data, please update your API key.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No ingredient data available to show contributors.
              </p>
            )}
          </div>

          <div className="p-4 bg-muted rounded-md mt-4">
            <h4 className="text-sm font-medium mb-2">Understanding Servings</h4>
            <p className="text-xs text-muted-foreground">
              When you adjust servings, the total recipe calories stay the same,
              but are divided among the new number of servings. For example, if
              a recipe with 2 servings has 800 total calories (400 per serving),
              changing to 4 servings shows 200 calories per serving (still 800
              total).
            </p>
            <div className="mt-3 pt-3 border-t border-muted-foreground/10">
              <h4 className="text-xs font-medium mb-1">
                Estimated Calorie Distribution
              </h4>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Protein: ~20%</span>
                <span>Carbs: ~45%</span>
                <span>Fat: ~35%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content based on active tab */}
      {activeTab === "summary" && (
        <div>
          <div className="mb-4">
            <p className="text-lg font-semibold mb-1">
              {Math.round(macroData.calories)} calories
            </p>
            <p className="text-sm text-muted-foreground">
              Per serving ({servings > 1 ? `${servings} servings` : "1 serving"}
              )
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-recipe-beige/50 p-3 rounded-md">
            {mainNutrients.map((nutrient) => (
              <div key={nutrient.name} className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: nutrient.color }}
                />
                <div>
                  <p className="text-sm font-medium">{nutrient.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatAmount(nutrient.amount)}
                    {nutrient.unit}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "macros" && (
        <div>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Macronutrient Distribution
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    `${Math.round(value)} cal`,
                    "Calories",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Protein</p>
              <p className="font-medium">{Math.round(proteinCalories)} cal</p>
              <p className="text-xs">
                {Math.round((proteinCalories / macroData.calories) * 100)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Carbs</p>
              <p className="font-medium">{Math.round(carbsCalories)} cal</p>
              <p className="text-xs">
                {Math.round((carbsCalories / macroData.calories) * 100)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fat</p>
              <p className="font-medium">{Math.round(fatCalories)} cal</p>
              <p className="text-xs">
                {Math.round((fatCalories / macroData.calories) * 100)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "chart" && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Nutrient Amounts</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mainNutrients}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}g`]} />
              <Bar dataKey="amount" name="Amount">
                {mainNutrients.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
