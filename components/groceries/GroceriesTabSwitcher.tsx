import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { colors, spacing, borderRadius } from "../../utils/styleUtils";
import { useGroceries } from "../../context/GroceriesContext";

const GroceriesTabSwitcher: React.FC = () => {
  const { activeView, setActiveView } = useGroceries();
  const slideAnimation = useRef(
    new Animated.Value(activeView === "shopping" ? 0 : 1)
  ).current;

  useEffect(() => {
    Animated.spring(slideAnimation, {
      toValue: activeView === "shopping" ? 0 : 1,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [activeView]);

  const slideInterpolation = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "50%"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <Animated.View
          style={[styles.activeTabBackground, { left: slideInterpolation }]}
        />

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveView("shopping")}
        >
          <Text
            style={[
              styles.tabText,
              activeView === "shopping" && styles.activeTabText,
            ]}
          >
            Shopping List
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveView("cupboard")}
        >
          <Text
            style={[
              styles.tabText,
              activeView === "cupboard" && styles.activeTabText,
            ]}
          >
            Cupboard
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.gray[600],
  },
  activeTabText: {
    color: colors.primary[600],
    fontWeight: "600",
  },
  activeTabBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default GroceriesTabSwitcher;
