import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../../../utils/styleUtils";
import { GroceryItem } from "../../../context/GroceriesContext";

interface ItemCardProps {
  item: GroceryItem;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  onPress?: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item,
  rightAction,
  leftAction,
  onPress,
}) => {
  // Animation values
  const opacity = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(10)).current;

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

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {leftAction && <View style={styles.leftAction}>{leftAction}</View>}

      <TouchableOpacity
        style={styles.contentContainer}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={styles.mainContent}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.quantity && (
            <Text style={styles.itemQuantity}>
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

      {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
    </Animated.View>
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
  leftAction: {
    justifyContent: "center",
    paddingLeft: spacing.md,
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
  rightAction: {
    justifyContent: "center",
    paddingRight: spacing.md,
  },
});

export default ItemCard;
