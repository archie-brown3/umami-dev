import React, { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../../utils/styleUtils";
import { ShoppingItem } from "../../../services/groceriesService";
import { getRecipeColor, getLightColor } from "../../../utils/groceryUtils";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Common units for grocery items
const COMMON_UNITS = [
  "", // No unit
  "kg",
  "g",
  "lb",
  "oz",
  "L",
  "ml",
  "cup",
  "tbsp",
  "tsp",
  "piece",
  "pieces",
  "pack",
  "bag",
  "box",
  "can",
  "bottle",
];

// Common quantities (as strings to match the data type)
const COMMON_QUANTITIES = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "0.25",
  "0.5",
  "0.75",
  "1.25",
  "1.5",
  "1.75",
  "2.5",
  "3.5",
  "4.5",
  "5.5",
];

interface ShoppingItemCardProps {
  item: ShoppingItem;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate?: (updates: {
    name?: string;
    quantity?: string;
    unit?: string;
  }) => void;
}

const ShoppingItemCard: React.FC<ShoppingItemCardProps> = ({
  item,
  onToggle,
  onDelete,
  onUpdate,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editQuantity, setEditQuantity] = useState(item.quantity || "");
  const [editUnit, setEditUnit] = useState(item.unit || "");

  // Get recipe color if this item is from a recipe
  const recipeColor = item.recipe_id ? getRecipeColor(item.recipe_id) : null;

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = () => {
    onDelete();
  };

  const handleSaveEdit = () => {
    if (onUpdate) {
      onUpdate({
        name: editName.trim() || item.name,
        quantity: editQuantity.trim() || item.quantity,
        unit: editUnit.trim() || item.unit,
      });
    }
    setShowEditModal(false);
  };

  const handleCancelEdit = () => {
    setEditName(item.name);
    setEditQuantity(item.quantity || "");
    setEditUnit(item.unit || "");
    setShowEditModal(false);
  };

  const renderQuantityPicker = () => (
    <View style={styles.pickerSection}>
      <Text style={styles.pickerLabel}>Quantity</Text>
      <ScrollView
        style={styles.pickerScrollView}
        showsVerticalScrollIndicator={false}
      >
        {COMMON_QUANTITIES.map((qty) => (
          <TouchableOpacity
            key={qty}
            style={[
              styles.pickerOption,
              editQuantity === qty && styles.pickerOptionSelected,
            ]}
            onPress={() => setEditQuantity(qty)}
          >
            <Text
              style={[
                styles.pickerOptionText,
                editQuantity === qty && styles.pickerOptionTextSelected,
              ]}
            >
              {qty}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderUnitPicker = () => (
    <View style={styles.pickerSection}>
      <Text style={styles.pickerLabel}>Unit</Text>
      <ScrollView
        style={styles.pickerScrollView}
        showsVerticalScrollIndicator={false}
      >
        {COMMON_UNITS.map((unit) => (
          <TouchableOpacity
            key={unit || "none"}
            style={[
              styles.pickerOption,
              editUnit === unit && styles.pickerOptionSelected,
            ]}
            onPress={() => setEditUnit(unit)}
          >
            <Text
              style={[
                styles.pickerOptionText,
                editUnit === unit && styles.pickerOptionTextSelected,
              ]}
            >
              {unit || "No unit"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      transparent
      animationType="slide"
      onRequestClose={handleCancelEdit}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Item</Text>
            <TouchableOpacity
              onPress={handleCancelEdit}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.gray[600]} />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.textInput}
            value={editName}
            onChangeText={setEditName}
            placeholder="Item name"
            autoFocus
          />

          <View style={styles.pickersContainer}>
            {renderQuantityPicker()}
            {renderUnitPicker()}
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleCancelEdit}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSaveEdit}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render right actions for swipe
  const renderRightActions = () => {
    return (
      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.editAction} onPress={handleEdit}>
          <Ionicons name="pencil" size={20} color={colors.white} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteAction} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color={colors.white} />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      <View style={styles.container}>
        <Swipeable renderRightActions={renderRightActions}>
          {/* Main Card Content */}
          <View
            style={[
              styles.cardContent,
              recipeColor && {
                borderLeftColor: recipeColor,
                borderLeftWidth: 3,
              },
            ]}
          >
            {/* Left Action - Checkbox */}
            <View style={styles.leftAction}>
              <TouchableOpacity onPress={onToggle} style={styles.checkbox}>
                <Ionicons
                  name={item.checked ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={item.checked ? colors.primary : colors.gray[400]}
                />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <TouchableOpacity
              style={styles.contentContainer}
              onPress={onToggle}
              activeOpacity={0.7}
            >
              <View style={styles.mainContent}>
                <Text
                  style={[styles.itemName, item.checked && styles.checkedText]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.name}
                </Text>
                {item.quantity && (
                  <Text
                    style={[
                      styles.itemQuantity,
                      item.checked && styles.checkedText,
                    ]}
                  >
                    {item.quantity} {item.unit || ""}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </Swipeable>
      </View>

      {renderEditModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xs,
    position: "relative",
  },
  cardContent: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray[200],
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 56,
  },
  leftAction: {
    justifyContent: "center",
    paddingLeft: spacing.md,
  },
  checkbox: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
    padding: spacing.md,
    paddingVertical: spacing.md + 2,
  },
  mainContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.gray[800],
    flex: 1,
    marginRight: spacing.sm,
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: "400",
  },
  checkedText: {
    textDecorationLine: "line-through",
    color: colors.gray[500],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.dark,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.sm,
    color: colors.dark,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    padding: spacing.md,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
  },
  pickersContainer: {
    flexDirection: "row",
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  pickerSection: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.sm,
    color: colors.gray[700],
  },
  pickerScrollView: {
    maxHeight: screenHeight * 0.25,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 8,
    backgroundColor: colors.gray[50],
  },
  pickerOption: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
    alignItems: "center",
  },
  pickerOptionSelected: {
    backgroundColor: colors.primary,
  },
  pickerOptionText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.gray[800],
  },
  pickerOptionTextSelected: {
    color: colors.white,
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  cancelButton: {
    backgroundColor: colors.gray[200],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray[800],
    textAlign: "center",
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
    textAlign: "center",
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "stretch",
    height: "100%",
  },
  editAction: {
    backgroundColor: colors.blue[500],
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    width: 80,
    minHeight: 56,
  },
  deleteAction: {
    backgroundColor: colors.red[500],
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    width: 80,
    minHeight: 56,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.white,
    marginTop: spacing.xs,
  },
});

export default ShoppingItemCard;
