import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { IngredientDetails } from "../../types";

interface NutrientDisplayProps {
  ingredient: IngredientDetails;
}

export function NutrientDisplay({ ingredient }: NutrientDisplayProps) {
  const { nutrients } = ingredient;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nutrition Information</Text>
      <View style={styles.grid}>
        {nutrients.calories && (
          <View style={styles.nutrient}>
            <Text style={styles.label}>Calories</Text>
            <Text style={styles.value}>{nutrients.calories} kcal</Text>
          </View>
        )}
        {nutrients.protein && (
          <View style={styles.nutrient}>
            <Text style={styles.label}>Protein</Text>
            <Text style={styles.value}>{nutrients.protein}g</Text>
          </View>
        )}
        {nutrients.carbs && (
          <View style={styles.nutrient}>
            <Text style={styles.label}>Carbs</Text>
            <Text style={styles.value}>{nutrients.carbs}g</Text>
          </View>
        )}
        {nutrients.fat && (
          <View style={styles.nutrient}>
            <Text style={styles.label}>Fat</Text>
            <Text style={styles.value}>{nutrients.fat}g</Text>
          </View>
        )}
        {nutrients.fiber && (
          <View style={styles.nutrient}>
            <Text style={styles.label}>Fiber</Text>
            <Text style={styles.value}>{nutrients.fiber}g</Text>
          </View>
        )}
        {nutrients.sugar && (
          <View style={styles.nutrient}>
            <Text style={styles.label}>Sugar</Text>
            <Text style={styles.value}>{nutrients.sugar}g</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  nutrient: {
    flex: 1,
    minWidth: "45%",
  },
  label: {
    fontSize: 12,
    color: "#64748b",
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
  },
});
