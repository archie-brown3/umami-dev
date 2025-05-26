import React from "react";
import { View, Text, StyleSheet, ActivityIndicator, Modal } from "react-native";
import { colors, spacing, typography } from "@/utils/styleUtils";

interface LoadingOverlayProps {
  message?: string;
  visible?: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = "Loading...",
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: "center",
    minWidth: 120,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  message: {
    marginTop: spacing.md,
    fontSize: typography.fontSizes.md,
    color: colors.dark,
    textAlign: "center",
  },
});

export default LoadingOverlay;
