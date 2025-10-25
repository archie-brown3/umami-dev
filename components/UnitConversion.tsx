import React, { useState, useEffect } from "react";
import { convertAmount } from "@/services/nutrition/nutritionService";

interface UnitConversionProps {
  ingredientName: string;
  amount: number;
  fromUnit: string;
  toUnit: string;
  onConversionResult?: (result: number) => void;
  children?: React.ReactNode;
}

export function UnitConversion({
  ingredientName,
  amount,
  fromUnit,
  toUnit,
  onConversionResult,
  children,
}: UnitConversionProps) {
  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip conversion if units are the same or any parameter is missing
    if (
      fromUnit === toUnit ||
      !ingredientName ||
      !amount ||
      !fromUnit ||
      !toUnit
    ) {
      setConvertedAmount(amount);
      onConversionResult?.(amount);
      return;
    }

    const performConversion = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await convertAmount(
          ingredientName,
          amount,
          fromUnit,
          toUnit
        );
        setConvertedAmount(result);
        onConversionResult?.(result);
      } catch (err) {
        console.error("Conversion error:", err);
        setError(`Couldn't convert ${fromUnit} to ${toUnit}`);
        setConvertedAmount(null);
      } finally {
        setIsLoading(false);
      }
    };

    performConversion();
  }, [ingredientName, amount, fromUnit, toUnit, onConversionResult]);

  // Function component that renders the converted value
  if (children) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <span className="text-gray-500">Converting...</span>;
  }

  if (error) {
    return <span className="text-red-500 text-sm">{error}</span>;
  }

  if (convertedAmount === null) {
    return <span className="text-gray-500">Unknown conversion</span>;
  }

  // Format the number nicely
  const formattedAmount =
    convertedAmount < 1
      ? convertedAmount.toFixed(2)
      : Math.round(convertedAmount * 10) / 10;

  return (
    <span>
      {formattedAmount} {toUnit}
    </span>
  );
}

// Common kitchen units
export const commonUnits = [
  { value: "g", label: "Grams (g)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "oz", label: "Ounces (oz)" },
  { value: "lb", label: "Pounds (lb)" },
  { value: "cup", label: "Cups" },
  { value: "tbsp", label: "Tablespoons" },
  { value: "tsp", label: "Teaspoons" },
  { value: "ml", label: "Milliliters (ml)" },
  { value: "l", label: "Liters (l)" },
  { value: "pinch", label: "Pinch" },
  { value: "piece", label: "Piece" },
  { value: "slice", label: "Slice" },
];

/**
 * Get a standardized unit name
 * @param unit The unit to standardize
 * @returns Standardized unit name
 */
export function standardizeUnit(unit: string): string {
  const unitLower = unit.toLowerCase().trim();

  // Common unit aliases
  const unitMap: Record<string, string> = {
    gram: "g",
    grams: "g",
    g: "g",
    kilogram: "kg",
    kilograms: "kg",
    kg: "kg",
    ounce: "oz",
    ounces: "oz",
    oz: "oz",
    pound: "lb",
    pounds: "lb",
    lb: "lb",
    lbs: "lb",
    cup: "cup",
    cups: "cup",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    tbsp: "tbsp",
    tbs: "tbsp",
    teaspoon: "tsp",
    teaspoons: "tsp",
    tsp: "tsp",
    milliliter: "ml",
    milliliters: "ml",
    ml: "ml",
    liter: "l",
    liters: "l",
    l: "l",
    pinch: "pinch",
    pinches: "pinch",
    piece: "piece",
    pieces: "piece",
    slice: "slice",
    slices: "slice",
  };

  return unitMap[unitLower] || unitLower;
}
