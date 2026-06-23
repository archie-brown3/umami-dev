import React from "react";
import { NutritionResult } from "../../services/nutrition"; // TODO: Ensure NutritionResult is exported from this

interface NutritionDisplayProps {
  nutrition: NutritionResult;
  servings?: number;
  compact?: boolean;
  className?: string;
}

export function NutritionDisplay({
  nutrition,
  servings = 1,
  compact = false,
  className = "",
}: NutritionDisplayProps) {
  // Divide nutrition values by servings if needed
  const perServing = servings > 1;
  const displayNutrition = perServing
    ? Object.entries(nutrition).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: Math.round(((value as number) / servings) * 10) / 10,
        }),
        {} as NutritionResult
      )
    : nutrition;

  // Helper to format numbers
  const formatNumber = (value: number): string => {
    if (value === 0) return "0";
    if (value < 1) return value.toFixed(1);
    return Math.round(value).toString();
  };

  if (compact) {
    return (
      <div className={`text-sm ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <span>Calories:</span>
          <span className="font-medium">
            {formatNumber(displayNutrition.calories)}
            {perServing && <span className="text-xs ml-1">per serving</span>}
          </span>
        </div>
        <div className="flex justify-between gap-6 mt-1 text-xs text-gray-600">
          <div>
            Protein: {formatNumber(displayNutrition.protein)}
            <span className="text-xs">g</span>
          </div>
          <div>
            Carbs: {formatNumber(displayNutrition.carbs)}
            <span className="text-xs">g</span>
          </div>
          <div>
            Fat: {formatNumber(displayNutrition.fat)}
            <span className="text-xs">g</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-2">
        Nutrition Facts
        {perServing && (
          <span className="text-sm font-normal ml-2">Per Serving</span>
        )}
      </h3>

      <div className="border-b-2 border-gray-900 pb-2 mb-2">
        <div className="flex justify-between">
          <span className="font-bold">Calories</span>
          <span className="font-bold">
            {formatNumber(displayNutrition.calories)}
          </span>
        </div>
      </div>

      <div className="py-1 flex justify-between">
        <span className="font-bold">Total Fat</span>
        <span>
          {formatNumber(displayNutrition.fat)}g
          {displayNutrition.saturated_fat !== undefined && (
            <span className="text-gray-500 text-sm">
              {" "}
              ({formatNumber(displayNutrition.saturated_fat)}g sat)
            </span>
          )}
        </span>
      </div>

      <div className="py-1 flex justify-between">
        <span className="font-bold">Total Carbohydrates</span>
        <span>
          {formatNumber(displayNutrition.carbs)}g
          {displayNutrition.fiber !== undefined && (
            <span className="text-gray-500 text-sm">
              {" "}
              ({formatNumber(displayNutrition.fiber)}g fiber)
            </span>
          )}
          {displayNutrition.sugar !== undefined && (
            <span className="text-gray-500 text-sm">
              {" "}
              ({formatNumber(displayNutrition.sugar)}g sugar)
            </span>
          )}
        </span>
      </div>

      <div className="py-1 flex justify-between">
        <span className="font-bold">Protein</span>
        <span>{formatNumber(displayNutrition.protein)}g</span>
      </div>

      {/* Additional nutrients */}
      <div className="border-t border-gray-300 pt-2 mt-2">
        {displayNutrition.sodium !== undefined && (
          <div className="text-sm py-1 flex justify-between">
            <span>Sodium</span>
            <span>{formatNumber(displayNutrition.sodium)}mg</span>
          </div>
        )}

        {displayNutrition.potassium !== undefined && (
          <div className="text-sm py-1 flex justify-between">
            <span>Potassium</span>
            <span>{formatNumber(displayNutrition.potassium)}mg</span>
          </div>
        )}

        {displayNutrition.cholesterol !== undefined && (
          <div className="text-sm py-1 flex justify-between">
            <span>Cholesterol</span>
            <span>{formatNumber(displayNutrition.cholesterol)}mg</span>
          </div>
        )}
      </div>

      {/* Vitamins and minerals */}
      {(displayNutrition.vitamin_a !== undefined ||
        displayNutrition.vitamin_c !== undefined ||
        displayNutrition.calcium !== undefined ||
        displayNutrition.iron !== undefined) && (
        <div className="border-t border-gray-300 pt-2 mt-2 grid grid-cols-2 gap-2 text-sm">
          {displayNutrition.vitamin_a !== undefined && (
            <div>Vitamin A: {formatNumber(displayNutrition.vitamin_a)}μg</div>
          )}
          {displayNutrition.vitamin_c !== undefined && (
            <div>Vitamin C: {formatNumber(displayNutrition.vitamin_c)}mg</div>
          )}
          {displayNutrition.calcium !== undefined && (
            <div>Calcium: {formatNumber(displayNutrition.calcium)}mg</div>
          )}
          {displayNutrition.iron !== undefined && (
            <div>Iron: {formatNumber(displayNutrition.iron)}mg</div>
          )}
        </div>
      )}

      {servings > 1 && (
        <div className="text-sm text-gray-500 mt-3">
          * Based on {servings} servings per recipe
        </div>
      )}
    </div>
  );
}
