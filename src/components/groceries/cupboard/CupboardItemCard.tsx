import React from "react";
import { TouchableOpacity, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../../utils/styleUtils";
import { CupboardItem } from "../../../context/GroceriesContext";
import ItemCard from "../shared/ItemCard";

interface CupboardItemCardProps {
  item: CupboardItem;
  onDelete: () => void;
  onUpdate: (updates: Partial<CupboardItem>) => void;
}

const CupboardItemCard: React.FC<CupboardItemCardProps> = ({
  item,
  onDelete,
  onUpdate,
}) => {
  // Check if expiration date is approaching (within 3 days)
  const isExpirationApproaching = () => {
    if (!item.expirationDate) return false;

    const today = new Date();
    const expirationDate = new Date(item.expirationDate);
    const timeDiff = expirationDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    return daysDiff >= 0 && daysDiff <= 3;
  };

  // Check if item is expired
  const isExpired = () => {
    if (!item.expirationDate) return false;

    const today = new Date();
    const expirationDate = new Date(item.expirationDate);

    return expirationDate < today;
  };

  // Format expiration date for display
  const formatExpirationDate = () => {
    if (!item.expirationDate) return null;

    const date = new Date(item.expirationDate);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getExpirationIcon = () => {
    if (isExpired()) {
      return <Ionicons name="alert-circle" size={16} color={colors.red[500]} />;
    }
    if (isExpirationApproaching()) {
      return (
        <Ionicons name="time-outline" size={16} color={colors.primary[500]} />
      );
    }
    return null;
  };

  const leftIcon = (
    <View style={styles.iconContainer}>
      <Ionicons name="cube-outline" size={20} color={colors.primary[500]} />
    </View>
  );

  const rightActions = (
    <View style={styles.actionsContainer}>
      {item.expirationDate && (
        <View
          style={[
            styles.expirationContainer,
            isExpired() && styles.expiredContainer,
            isExpirationApproaching() && styles.expiringContainer,
          ]}
        >
          {getExpirationIcon()}
          <Text
            style={[
              styles.expirationText,
              isExpired() && styles.expiredText,
              isExpirationApproaching() && styles.expiringText,
            ]}
          >
            {formatExpirationDate()}
          </Text>
        </View>
      )}
      <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={20} color={colors.gray[500]} />
      </TouchableOpacity>
    </View>
  );

  const handlePress = () => {
    // Could open an edit modal here
    console.log("Cupboard item pressed:", item.name);
  };

  return (
    <ItemCard
      item={item}
      leftAction={leftIcon}
      rightAction={rightActions}
      onPress={handlePress}
    />
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    padding: 4,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  expirationContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: spacing.sm,
  },
  expirationText: {
    fontSize: 12,
    color: colors.gray[600],
    marginLeft: 4,
  },
  expiredContainer: {
    backgroundColor: colors.red[500] + "20", // 20 = 12% opacity in hex
  },
  expiredText: {
    color: colors.red[500],
  },
  expiringContainer: {
    backgroundColor: colors.primary[600] + "20", // 20 = 12% opacity in hex
  },
  expiringText: {
    color: colors.primary[600],
  },
  deleteButton: {
    padding: 8,
  },
});

export default CupboardItemCard;
