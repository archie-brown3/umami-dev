import React, { useState } from "react";
import { TouchableOpacity, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../../utils/styleUtils";
import AddItemModal from "./AddItemModal";

interface AddItemButtonProps {
  screenType: "shopping" | "cupboard";
}

const AddItemButton: React.FC<AddItemButtonProps> = ({ screenType }) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color={colors.white} />
      </TouchableOpacity>

      <AddItemModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        screenType={screenType}
      />
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
});

export default AddItemButton;
