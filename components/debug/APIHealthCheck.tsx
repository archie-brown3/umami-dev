import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { APIHealthCheckProps } from "@/types/debug.types";
import { colors, spacing, typography, borderRadius } from "@/utils/styleUtils";
import { STATUS_COLORS } from "@/constants/api";
import { LogViewer } from "./LogViewer";

export const APIHealthCheck: React.FC<APIHealthCheckProps> = ({
  title,
  status,
  logs,
  onCheck,
  isLoading,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.statusContainer}>
        <Text
          style={
            status?.status === "Available"
              ? styles.successText
              : styles.errorText
          }
        >
          {status ? `${status.status} (${status.timestamp})` : "Unknown"}
        </Text>
      </View>
      {status?.error && <Text style={styles.errorText}>{status.error}</Text>}
      <TouchableOpacity
        style={styles.button}
        onPress={onCheck}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? "Testing..." : `Test ${title}`}
        </Text>
      </TouchableOpacity>
      <LogViewer logs={logs} />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    paddingBottom: spacing.sm,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  successText: {
    fontSize: typography.fontSizes.sm,
    color: STATUS_COLORS.success,
    marginTop: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: STATUS_COLORS.error,
    marginTop: spacing.xs,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSizes.md,
    fontWeight: "600",
  },
});
