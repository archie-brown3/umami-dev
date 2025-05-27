import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "../../utils/styleUtils";

interface ServingScalerProps {
  originalServings: number;
  currentServings: number;
  onServingsChange: (newServings: number) => void;
  minServings?: number;
  maxServings?: number;
}

const ServingScaler: React.FC<ServingScalerProps> = ({
  originalServings,
  currentServings,
  onServingsChange,
  minServings = 1,
  maxServings = 20,
}) => {
  const canDecrease = currentServings > minServings;
  const canIncrease = currentServings < maxServings;

  const handleDecrease = () => {
    if (canDecrease) {
      onServingsChange(currentServings - 1);
    }
  };

  const handleIncrease = () => {
    if (canIncrease) {
      onServingsChange(currentServings + 1);
    }
  };

  const scalingFactor = currentServings / originalServings;
  const isScaled = currentServings !== originalServings;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Servings</Text>
        {isScaled && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={() => onServingsChange(originalServings)}
          >
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.scalerContainer}>
        <TouchableOpacity
          style={[styles.button, !canDecrease && styles.buttonDisabled]}
          onPress={handleDecrease}
          disabled={!canDecrease}
        >
          <Ionicons
            name="remove"
            size={20}
            color={canDecrease ? colors.primary : colors.gray[400]}
          />
        </TouchableOpacity>

        <View style={styles.servingsDisplay}>
          <Text style={styles.servingsNumber}>{currentServings}</Text>
          <Text style={styles.servingsLabel}>
            {currentServings === 1 ? "serving" : "servings"}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, !canIncrease && styles.buttonDisabled]}
          onPress={handleIncrease}
          disabled={!canIncrease}
        >
          <Ionicons
            name="add"
            size={20}
            color={canIncrease ? colors.primary : colors.gray[400]}
          />
        </TouchableOpacity>
      </View>

      {isScaled && (
        <View style={styles.scalingInfo}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={colors.blue[600]}
          />
          <Text style={styles.scalingText}>
            Ingredients scaled by {scalingFactor.toFixed(1)}x from original
            recipe
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.dark,
  },
  resetButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[100],
  },
  resetText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  scalerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[100],
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: colors.gray[100],
  },
  servingsDisplay: {
    alignItems: "center",
    marginHorizontal: spacing.xl,
    minWidth: 80,
  },
  servingsNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.dark,
    lineHeight: 36,
  },
  servingsLabel: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: 2,
  },
  scalingInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  scalingText: {
    fontSize: 14,
    color: colors.blue[600],
    marginLeft: spacing.xs,
    flex: 1,
  },
});

export default ServingScaler;
