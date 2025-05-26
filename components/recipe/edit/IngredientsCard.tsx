import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ScrollView,
  Pressable,
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

// Common cooking units
const COOKING_UNITS = [
  { label: "No unit", value: "" },
  { label: "Cup", value: "cup" },
  { label: "Cups", value: "cups" },
  { label: "Tablespoon", value: "tbsp" },
  { label: "Tablespoons", value: "tbsps" },
  { label: "Teaspoon", value: "tsp" },
  { label: "Teaspoons", value: "tsps" },
  { label: "Ounce", value: "oz" },
  { label: "Ounces", value: "ozs" },
  { label: "Fluid ounce", value: "fl oz" },
  { label: "Fluid ounces", value: "fl ozs" },
  { label: "Pound", value: "lb" },
  { label: "Pounds", value: "lbs" },
  { label: "Gram", value: "g" },
  { label: "Grams", value: "grams" },
  { label: "Kilogram", value: "kg" },
  { label: "Kilograms", value: "kgs" },
  { label: "Milliliter", value: "ml" },
  { label: "Milliliters", value: "mls" },
  { label: "Liter", value: "l" },
  { label: "Liters", value: "liters" },
  { label: "Pint", value: "pint" },
  { label: "Pints", value: "pints" },
  { label: "Quart", value: "quart" },
  { label: "Quarts", value: "quarts" },
  { label: "Gallon", value: "gallon" },
  { label: "Gallons", value: "gallons" },
  { label: "Piece", value: "piece" },
  { label: "Pieces", value: "pieces" },
  { label: "Slice", value: "slice" },
  { label: "Slices", value: "slices" },
  { label: "Clove", value: "clove" },
  { label: "Cloves", value: "cloves" },
  { label: "Pinch", value: "pinch" },
  { label: "Dash", value: "dash" },
  { label: "Handful", value: "handful" },
  { label: "Bunch", value: "bunch" },
  { label: "Package", value: "package" },
  { label: "Can", value: "can" },
  { label: "Jar", value: "jar" },
  { label: "Bottle", value: "bottle" },
  { label: "Box", value: "box" },
  { label: "Bag", value: "bag" },
];

interface UnitPickerProps {
  selectedUnit: string;
  onUnitChange: (unit: string) => void;
}

const UnitPicker: React.FC<UnitPickerProps> = ({
  selectedUnit,
  onUnitChange,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [customUnit, setCustomUnit] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleUnitSelect = (unit: string) => {
    if (unit === "custom") {
      setShowCustomInput(true);
      return;
    }
    onUnitChange(unit);
    setModalVisible(false);
    setShowCustomInput(false);
    setCustomUnit("");
  };

  const handleCustomUnitSave = () => {
    if (customUnit.trim()) {
      onUnitChange(customUnit.trim());
      setModalVisible(false);
      setShowCustomInput(false);
      setCustomUnit("");
    }
  };

  const selectedUnitLabel =
    COOKING_UNITS.find((unit) => unit.value === selectedUnit)?.label ||
    selectedUnit ||
    "unit";
  const isCustomUnit =
    selectedUnit && !COOKING_UNITS.find((unit) => unit.value === selectedUnit);

  return (
    <>
      <TouchableOpacity
        style={styles.unitPicker}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={[
            styles.unitPickerText,
            selectedUnit && styles.unitPickerTextSelected,
          ]}
          numberOfLines={1}
        >
          {selectedUnitLabel}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.gray[500]} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Unit</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={colors.gray[600]} />
              </TouchableOpacity>
            </View>

            {showCustomInput ? (
              <View style={styles.customUnitContainer}>
                <Text style={styles.customUnitLabel}>Enter custom unit:</Text>
                <TextInput
                  style={styles.customUnitInput}
                  value={customUnit}
                  onChangeText={setCustomUnit}
                  placeholder="e.g., bunches, containers"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleCustomUnitSave}
                />
                <View style={styles.customUnitButtons}>
                  <TouchableOpacity
                    style={[
                      styles.customUnitButton,
                      styles.customUnitButtonCancel,
                    ]}
                    onPress={() => {
                      setShowCustomInput(false);
                      setCustomUnit("");
                    }}
                  >
                    <Text style={styles.customUnitButtonTextCancel}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.customUnitButton,
                      styles.customUnitButtonSave,
                    ]}
                    onPress={handleCustomUnitSave}
                  >
                    <Text style={styles.customUnitButtonTextSave}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <ScrollView
                style={styles.unitList}
                showsVerticalScrollIndicator={false}
              >
                {COOKING_UNITS.map((unit) => (
                  <Pressable
                    key={unit.value}
                    style={[
                      styles.unitOption,
                      selectedUnit === unit.value && styles.unitOptionSelected,
                    ]}
                    onPress={() => handleUnitSelect(unit.value)}
                  >
                    <Text
                      style={[
                        styles.unitOptionText,
                        selectedUnit === unit.value &&
                          styles.unitOptionTextSelected,
                      ]}
                    >
                      {unit.label}
                    </Text>
                    {selectedUnit === unit.value && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </Pressable>
                ))}

                {/* Show current custom unit if it exists */}
                {isCustomUnit && (
                  <Pressable
                    style={[styles.unitOption, styles.unitOptionSelected]}
                    onPress={() => handleUnitSelect(selectedUnit)}
                  >
                    <Text
                      style={[
                        styles.unitOptionText,
                        styles.unitOptionTextSelected,
                      ]}
                    >
                      {selectedUnit} (current)
                    </Text>
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  </Pressable>
                )}

                {/* Custom unit option */}
                <Pressable
                  style={styles.unitOption}
                  onPress={() => handleUnitSelect("custom")}
                >
                  <Text style={styles.unitOptionText}>Custom unit...</Text>
                  <Ionicons name="add" size={20} color={colors.gray[500]} />
                </Pressable>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

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
          <UnitPicker
            selectedUnit={item.unit}
            onUnitChange={(unit) => onUpdate(index, { ...item, unit })}
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
  unitPicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    minHeight: 40,
    backgroundColor: colors.white,
  },
  unitPickerText: {
    fontSize: typography.fontSizes.sm,
    color: colors.dark,
    flex: 1,
  },
  unitPickerTextSelected: {
    fontWeight: "600",
    color: colors.dark,
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
    textAlign: "center",
    marginTop: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    maxHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700",
    color: colors.dark,
  },
  modalCloseButton: {
    padding: spacing.xs,
  },
  unitList: {
    maxHeight: 300,
  },
  unitOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  unitOptionSelected: {
    backgroundColor: colors.primary + "20",
  },
  unitOptionText: {
    fontSize: typography.fontSizes.md,
    color: colors.dark,
  },
  unitOptionTextSelected: {
    fontWeight: "600",
    color: colors.primary,
  },
  customUnitContainer: {
    padding: spacing.md,
  },
  customUnitLabel: {
    fontSize: typography.fontSizes.md,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  customUnitInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: typography.fontSizes.md,
    minHeight: 40,
    marginBottom: spacing.md,
  },
  customUnitButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  customUnitButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: "center",
  },
  customUnitButtonCancel: {
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  customUnitButtonSave: {
    backgroundColor: colors.primary,
  },
  customUnitButtonTextCancel: {
    fontSize: typography.fontSizes.md,
    color: colors.gray[600],
    fontWeight: "600",
  },
  customUnitButtonTextSave: {
    fontSize: typography.fontSizes.md,
    color: colors.white,
    fontWeight: "600",
  },
});

export default IngredientsCard;
