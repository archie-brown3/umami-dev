import React from "react";
import {
  IngredientDetails,
  Nutrient,
  convertUnitForNutrition,
} from "@/services/nutrition";

interface NutrientDisplayProps {
  ingredient: IngredientDetails;
  amount: number;
  unit: string;
  compact?: boolean;
}

export const NutrientDisplay: React.FC<NutrientDisplayProps> = ({
  ingredient,
  amount,
  unit,
  compact = true,
}) => {
  if (!ingredient || !ingredient.nutrients) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No nutrition data available
      </p>
    );
  }

  // Convert ingredient amount to the appropriate unit for nutrition calculation
  const { convertedAmount, conversionFactor } = convertUnitForNutrition(
    amount,
    unit,
    ingredient
  );

  // Primary nutrients to display in compact mode
  const primaryNutrients = [
    { id: "calories", name: "Calories", unit: "kcal" },
    { id: "protein", name: "Protein", unit: "g" },
    { id: "fat", name: "Fat", unit: "g" },
    { id: "carbohydrates", name: "Carbs", unit: "g" },
    { id: "fiber", name: "Fiber", unit: "g" },
  ];

  // Format nutrient value with appropriate precision and unit
  const formatNutrientValue = (value: number, unit: string) => {
    // Round to appropriate precision based on value
    let formattedValue = value;
    if (value < 1) {
      formattedValue = Math.round(value * 100) / 100; // 2 decimal places for small values
    } else if (value < 10) {
      formattedValue = Math.round(value * 10) / 10; // 1 decimal place for medium values
    } else {
      formattedValue = Math.round(value); // No decimal places for large values
    }

    // Format with unit
    return `${formattedValue}${unit}`;
  };

  // Get a specific nutrient by ID
  const getNutrient = (id: string): Nutrient | undefined => {
    return ingredient.nutrients?.find(
      (n) => n.id === id || n.name.toLowerCase() === id.toLowerCase()
    );
  };

  // Get the value of a nutrient, scaling by the conversion factor
  const getNutrientValue = (id: string): number => {
    const nutrient = getNutrient(id);
    if (!nutrient) return 0;
    return nutrient.amount * conversionFactor;
  };

  return (
    <div className="text-xs">
      {compact ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {primaryNutrients.map((nutrient) => {
            const value = getNutrientValue(nutrient.id);
            if (value === 0 && nutrient.id !== "calories") return null;

            return (
              <div key={nutrient.id} className="flex items-center">
                <span className="font-medium">{nutrient.name}:</span>
                <span className="ml-1">
                  {formatNutrientValue(value, nutrient.unit)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {ingredient.nutrients?.map((nutrient) => {
            const scaledValue = nutrient.amount * conversionFactor;
            if (scaledValue === 0) return null;

            return (
              <div
                key={nutrient.id}
                className="flex items-center justify-between"
              >
                <span>{nutrient.name}:</span>
                <span>{formatNutrientValue(scaledValue, nutrient.unit)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
