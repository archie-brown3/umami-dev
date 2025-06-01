import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, spacing } from "@/utils/styleUtils";

export default function AuthDivider() {
  return (
    <View style={styles.container}>
      <View style={styles.line} />
      <Text style={styles.text}>OR</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[300],
  },
  text: {
    marginHorizontal: spacing.md,
    color: colors.gray[500],
    fontSize: 14,
    fontWeight: "500",
  },
});
