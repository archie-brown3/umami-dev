import React from "react";
import { StyleSheet, View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing, typography } from "../../utils/styleUtils";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.centered}>
        <Text style={styles.title}>Welcome to Recipe App!</Text>
        <Text style={styles.subtitle}>This is your home screen.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: typography.fontSizes.md,
    color: colors.gray[700],
  },
});
