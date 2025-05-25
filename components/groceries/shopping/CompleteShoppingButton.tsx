import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, borderRadius } from "../../../utils/styleUtils";
import { useGroceries } from "../../../context/GroceriesContext";

const CompleteShoppingButton: React.FC = () => {
  const { shoppingList, moveCheckedItemsToCupboard, setActiveView } =
    useGroceries();

  const checkedItemsCount = shoppingList.filter((item) => item.checked).length;

  const handleCompleteShoppingPress = () => {
    if (checkedItemsCount === 0) {
      Alert.alert(
        "No Items Selected",
        "Please check off items you've purchased before completing your shopping.",
        [{ text: "OK" }]
      );
      return;
    }

    Alert.alert(
      "Complete Shopping",
      `Move ${checkedItemsCount} checked item${
        checkedItemsCount === 1 ? "" : "s"
      } to your cupboard?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Complete",
          style: "default",
          onPress: () => {
            moveCheckedItemsToCupboard();

            // Show success message and navigate to cupboard
            Alert.alert(
              "Shopping Complete!",
              `${checkedItemsCount} item${
                checkedItemsCount === 1 ? " has" : "s have"
              } been moved to your cupboard.`,
              [
                {
                  text: "View Cupboard",
                  onPress: () => setActiveView("cupboard"),
                },
                { text: "Stay Here", style: "cancel" },
              ]
            );
          },
        },
      ]
    );
  };

  // Don't show button if no items in shopping list
  if (shoppingList.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          checkedItemsCount === 0 && styles.buttonDisabled,
        ]}
        onPress={handleCompleteShoppingPress}
        disabled={checkedItemsCount === 0}
      >
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={checkedItemsCount > 0 ? colors.white : colors.gray[400]}
        />
        <Text
          style={[
            styles.buttonText,
            checkedItemsCount === 0 && styles.buttonTextDisabled,
          ]}
        >
          Complete Shopping
          {checkedItemsCount > 0 && ` (${checkedItemsCount})`}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  button: {
    backgroundColor: colors.primary[600],
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: colors.gray[200],
    shadowColor: "transparent",
    elevation: 0,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  buttonTextDisabled: {
    color: colors.gray[400],
  },
});

export default CompleteShoppingButton;
