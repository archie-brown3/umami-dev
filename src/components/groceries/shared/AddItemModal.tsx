import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../../utils/styleUtils";
import { useGroceries } from "../../../context/GroceriesContext";

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  screenType: "shopping" | "cupboard";
}

const CATEGORIES = [
  "Produce",
  "Dairy",
  "Meat",
  "Bakery",
  "Pantry",
  "Frozen",
  "Beverages",
  "Snacks",
  "Household",
];

const UNITS = ["g", "kg", "ml", "L", "pcs", "pkg", "box", "can", "bottle"];

const AddItemModal: React.FC<AddItemModalProps> = ({
  visible,
  onClose,
  screenType,
}) => {
  const { addShoppingItem, addCupboardItem, addItemToShoppingList } =
    useGroceries();

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState("");
  const [expirationDate, setExpirationDate] = useState("");

  const resetForm = () => {
    setName("");
    setQuantity("");
    setUnit("");
    setCategory("");
    setExpirationDate("");
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    const baseItem = {
      name: name.trim(),
      quantity: quantity ? parseFloat(quantity) : undefined,
      unit: unit || undefined,
      category: category || undefined,
    };

    if (screenType === "shopping") {
      addItemToShoppingList({
        name: baseItem.name,
        quantity: quantity || "1",
        unit: baseItem.unit,
        category: baseItem.category || "Pantry",
        checked: false,
      });
    } else {
      addCupboardItem({
        ...baseItem,
        expirationDate: expirationDate ? new Date(expirationDate) : undefined,
      });
    }

    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.title}>
                  Add to{" "}
                  {screenType === "shopping" ? "Shopping List" : "Cupboard"}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={colors.gray[700]} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.formContainer}>
                <Text style={styles.label}>Item Name*</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter item name"
                  placeholderTextColor={colors.gray[400]}
                  autoCapitalize="words"
                />

                <View style={styles.row}>
                  <View style={styles.halfColumn}>
                    <Text style={styles.label}>Quantity</Text>
                    <TextInput
                      style={styles.input}
                      value={quantity}
                      onChangeText={setQuantity}
                      placeholder="Amount"
                      placeholderTextColor={colors.gray[400]}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.halfColumn}>
                    <Text style={styles.label}>Unit</Text>
                    <View style={styles.dropdownContainer}>
                      <TextInput
                        style={styles.input}
                        value={unit}
                        onChangeText={setUnit}
                        placeholder="Unit (optional)"
                        placeholderTextColor={colors.gray[400]}
                      />
                      {/* Unit suggestions could go here */}
                    </View>
                  </View>
                </View>

                <Text style={styles.label}>Category</Text>
                <View style={styles.categoriesContainer}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        category === cat && styles.categoryChipSelected,
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          category === cat && styles.categoryChipTextSelected,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {screenType === "cupboard" && (
                  <>
                    <Text style={styles.label}>Expiration Date</Text>
                    <TextInput
                      style={styles.input}
                      value={expirationDate}
                      onChangeText={setExpirationDate}
                      placeholder="YYYY-MM-DD (optional)"
                      placeholderTextColor={colors.gray[400]}
                    />
                  </>
                )}
              </ScrollView>

              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.addButton,
                    !name.trim() && styles.disabledButton,
                  ]}
                  onPress={handleSubmit}
                  disabled={!name.trim()}
                >
                  <Text style={styles.buttonText}>Add Item</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  keyboardAvoidingView: {
    width: "100%",
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.lg,
    maxHeight: "80%",
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
  closeButton: {
    padding: spacing.xs,
  },
  formContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.gray[700],
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.md,
    fontSize: 16,
    color: colors.dark,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfColumn: {
    width: "48%",
  },
  dropdownContainer: {
    position: "relative",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: spacing.md,
  },
  categoryChip: {
    backgroundColor: colors.gray[100],
    borderRadius: 16,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    margin: 4,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary[100],
  },
  categoryChipText: {
    fontSize: 14,
    color: colors.gray[700],
  },
  categoryChipTextSelected: {
    color: colors.primary[700],
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: colors.gray[200],
    marginRight: 8,
  },
  addButton: {
    backgroundColor: colors.primary[600],
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: colors.gray[300],
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.white,
  },
});

export default AddItemModal;
