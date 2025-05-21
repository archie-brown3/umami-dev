import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../../utils/styleUtils";
import { ShoppingItem } from "../../../context/GroceriesContext";
import ItemCard from "../shared/ItemCard";

interface ShoppingItemCardProps {
  item: ShoppingItem;
  onToggle: () => void;
  onDelete: () => void;
}

const ShoppingItemCard: React.FC<ShoppingItemCardProps> = ({
  item,
  onToggle,
  onDelete,
}) => {
  const leftAction = (
    <TouchableOpacity onPress={onToggle} style={styles.checkbox}>
      <Ionicons
        name={item.checked ? "checkmark-circle" : "ellipse-outline"}
        size={24}
        color={item.checked ? colors.primary[500] : colors.gray[400]}
      />
    </TouchableOpacity>
  );

  const rightAction = (
    <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
      <Ionicons name="trash-outline" size={20} color={colors.gray[500]} />
    </TouchableOpacity>
  );

  return (
    <ItemCard
      item={item}
      leftAction={leftAction}
      rightAction={rightAction}
      onPress={onToggle}
    />
  );
};

const styles = StyleSheet.create({
  checkbox: {
    padding: 4,
  },
  deleteButton: {
    padding: 8,
  },
});

export default ShoppingItemCard;
