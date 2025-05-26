import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../../utils/styleUtils";
import { ShoppingItem } from "../../../services/groceriesService";

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
  // Animation values
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(10)).current;

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editQuantity, setEditQuantity] = useState(item.quantity || "");
  const [editUnit, setEditUnit] = useState(item.unit || "");

  React.useEffect(() => {
    // Animate card in when mounted
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSaveEdit = () => {
    if (onUpdate) {
      onUpdate({
        name: editName.trim() || item.name,
        quantity: editQuantity.trim(),
        unit: editUnit.trim(),
      });
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(item.name);
    setEditQuantity(item.quantity || "");
    setEditUnit(item.unit || "");
    setIsEditing(false);
  };

  const renderEditModal = () => (
    <Modal
      visible={isEditing}
      transparent
      animationType="fade"
      onRequestClose={handleCancelEdit}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Item</Text>

          <Text style={styles.inputLabel}>Name</Text>
          <TextInput
            style={styles.textInput}
            value={editName}
            onChangeText={setEditName}
            placeholder="Item name"
          />

          <View style={styles.quantityRow}>
            <View style={styles.quantityContainer}>
              <Text style={styles.inputLabel}>Quantity</Text>
              <TextInput
                style={styles.textInput}
                value={editQuantity}
                onChangeText={setEditQuantity}
                placeholder="1"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.unitContainer}>
              <Text style={styles.inputLabel}>Unit</Text>
              <TextInput
                style={styles.textInput}
                value={editUnit}
                onChangeText={setEditUnit}
                placeholder="kg, pcs, etc."
              />
            </View>
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

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <TouchableOpacity onPress={onToggle} style={styles.checkbox}>
          <Ionicons
            name={item.checked ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={item.checked ? colors.primary : colors.gray[400]}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contentContainer}
          onPress={onToggle}
          activeOpacity={0.7}
        >
          <View style={styles.mainContent}>
            <Text style={[styles.itemName, item.checked && styles.checkedText]}>
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
            {item.category && (
              <View style={styles.categoryChip}>
                <Text style={styles.categoryText}>{item.category}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.actionButtons}>
          {onUpdate && (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              style={styles.editButton}
            >
              <Ionicons
                name="pencil-outline"
                size={18}
                color={colors.gray[500]}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={18} color={colors.gray[500]} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {renderEditModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: spacing.sm,
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  checkbox: {
    justifyContent: "center",
    paddingLeft: spacing.md,
    padding: 4,
  },
  contentContainer: {
    flex: 1,
    padding: spacing.md,
    paddingVertical: spacing.md + 2,
  },
  mainContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
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
    marginRight: spacing.sm,
  },
  checkedText: {
    textDecorationLine: "line-through",
    color: colors.gray[500],
  },
  categoryChip: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: colors.gray[700],
  },
  deleteButton: {
    justifyContent: "center",
    paddingRight: spacing.md,
    padding: 8,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.md,
  },
  editButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    width: "80%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    padding: spacing.sm,
    borderRadius: 8,
  },
  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  quantityContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  unitContainer: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: colors.gray[200],
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.gray[800],
    padding: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.white,
    padding: spacing.md,
  },
});

export default ShoppingItemCard;
