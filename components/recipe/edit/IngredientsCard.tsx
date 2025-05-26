import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Ingredient } from "@/types";
import {
  validateIngredientAmount,
  VALIDATION_LIMITS,
} from "@/utils/recipeValidation";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  createShadow,
} from "@/utils/styleUtils";

interface IngredientsCardProps {
  ingredients: Ingredient[];
  onAdd: () => void;
  onUpdate: (index: number, ingredient: Ingredient) => void;
  onRemove: (index: number) => void;
  error?: string;
}

const IngredientsCard: React.FC<IngredientsCardProps> = ({
  ingredients,
  onAdd,
  onUpdate,
  onRemove,
  error,
}) => {
  const canAddMore = ingredients.length < VALIDATION_LIMITS.INGREDIENTS.max;

  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length <= 1) {
      Alert.alert(
        "Cannot Remove",
        "A recipe must have at least one ingredient."
      );
      return;
    }

    Alert.alert(
      "Remove Ingredient",
      "Are you sure you want to remove this ingredient?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => onRemove(index),
        },
      ]
    );
  };

  const renderIngredient = ({
    item,
    index,
  }: {
    item: Ingredient;
    index: number;
  }) => {
    const amountValidation = validateIngredientAmount(item.amount.toString());

    return (
      <View style={styles.ingredientRow}>
        <View style={styles.ingredientNumber}>
          <Text style={styles.ingredientNumberText}>{index + 1}</Text>
        </View>

        <View style={styles.amountContainer}>
          <TextInput
            style={[
              styles.amountInput,
              !amountValidation.isValid && styles.inputError,
            ]}
            value={item.amount.toString()}
            onChangeText={(text) => {
              // Allow fractions and decimals
              const cleanText = text.replace(/[^0-9./\s]/g, "");
              const validation = validateIngredientAmount(cleanText);
              onUpdate(index, {
                ...item,
                amount: validation.isValid
                  ? validation.numericValue
                  : parseFloat(cleanText) || 0,
              });
            }}
            placeholder="1"
            keyboardType="numeric"
            returnKeyType="next"
          />
        </View>

        <View style={styles.unitContainer}>
          <TextInput
            style={styles.unitInput}
            value={item.unit}
            onChangeText={(text) => onUpdate(index, { ...item, unit: text })}
            placeholder="unit"
            returnKeyType="next"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.nameContainer}>
          <TextInput
            style={[styles.nameInput, !item.name.trim() && styles.inputError]}
            value={item.name}
            onChangeText={(text) => onUpdate(index, { ...item, name: text })}
            placeholder="Ingredient name"
            maxLength={VALIDATION_LIMITS.INGREDIENT_NAME.max}
            returnKeyType="next"
            autoCapitalize="words"
          />
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveIngredient(index)}
          disabled={ingredients.length <= 1}
        >
          <Ionicons
            name="close-circle"
            size={24}
            color={ingredients.length <= 1 ? colors.gray[300] : colors.red[500]}
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          Ingredients ({ingredients.length}/{VALIDATION_LIMITS.INGREDIENTS.max})
        </Text>
        {canAddMore && (
          <TouchableOpacity style={styles.addButton} onPress={onAdd}>
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Column Headers */}
      <View style={styles.headerRow}>
        <View style={styles.headerNumber}>
          <Text style={styles.headerText}>#</Text>
        </View>
        <View style={styles.headerAmount}>
          <Text style={styles.headerText}>Amount</Text>
        </View>
        <View style={styles.headerUnit}>
          <Text style={styles.headerText}>Unit</Text>
        </View>
        <View style={styles.headerName}>
          <Text style={styles.headerText}>Ingredient</Text>
        </View>
        <View style={styles.headerAction}>
          <Text style={styles.headerText}></Text>
        </View>
      </View>

      <FlatList
        data={ingredients}
        renderItem={renderIngredient}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />

      {!canAddMore && (
        <Text style={styles.limitText}>
          Maximum {VALIDATION_LIMITS.INGREDIENTS.max} ingredients allowed
        </Text>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {canAddMore && (
        <TouchableOpacity style={styles.addMoreButton} onPress={onAdd}>
          <Ionicons
            name="add-circle-outline"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.addMoreText}>Add Another Ingredient</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...createShadow(2, 0.1, 8),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700",
    color: colors.dark,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "20",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    marginBottom: spacing.sm,
  },
  headerNumber: {
    width: 32,
    alignItems: "center",
    marginRight: spacing.sm,
  },
  headerAmount: {
    width: 60,
    marginRight: spacing.sm,
  },
  headerUnit: {
    width: 80,
    marginRight: spacing.sm,
  },
  headerName: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerAction: {
    width: 32,
  },
  headerText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: "600",
    color: colors.gray[500],
    textAlign: "center",
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  ingredientNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  ingredientNumberText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600",
    color: colors.gray[600],
  },
  amountContainer: {
    width: 60,
    marginRight: spacing.sm,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: typography.fontSizes.sm,
    textAlign: "center",
    minHeight: 40,
  },
  unitContainer: {
    width: 80,
    marginRight: spacing.sm,
  },
  unitInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: typography.fontSizes.sm,
    minHeight: 40,
  },
  nameContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: typography.fontSizes.sm,
    minHeight: 40,
  },
  inputError: {
    borderColor: colors.red[500],
    borderWidth: 2,
  },
  removeButton: {
    padding: spacing.xs,
    width: 32,
    alignItems: "center",
  },
  separator: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: spacing.xs,
  },
  addMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: "dashed",
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  addMoreText: {
    fontSize: typography.fontSizes.md,
    color: colors.primary,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  limitText: {
    fontSize: typography.fontSizes.xs,
    color: colors.gray[500],
    textAlign: "center",
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.red[500],
    marginTop: spacing.sm,
  },
});

export default IngredientsCard;
