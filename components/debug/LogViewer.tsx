import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { LogViewerProps } from "@/types/debug.types";
import { colors, spacing, typography, borderRadius } from "@/utils/styleUtils";

export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  title,
  maxHeight = 300,
}) => {
  return (
    <View style={styles.logsContainer}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={[styles.logContent, { maxHeight }]}>
        {logs.length > 0 ? (
          logs.map((log, idx) => (
            <Text key={idx} style={styles.logEntry}>
              {log}
            </Text>
          ))
        ) : (
          <Text style={styles.emptyLogText}>No logs yet.</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  logsContainer: {
    marginTop: spacing.sm,
  },
  title: {
    fontSize: typography.fontSizes.md,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  logContent: {
    padding: spacing.sm,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.sm,
  },
  logEntry: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[700],
    marginBottom: spacing.xs,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  emptyLogText: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[500],
    fontStyle: "italic",
  },
});
