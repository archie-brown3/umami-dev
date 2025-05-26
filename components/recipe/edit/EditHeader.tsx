import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography, createShadow } from "@/utils/styleUtils";

interface EditHeaderProps {
  isDirty: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  mode?: "edit" | "create";
}

const EditHeader: React.FC<EditHeaderProps> = ({
  isDirty,
  isSaving,
  lastSaved,
  onSave,
  onCancel,
  onDelete,
  mode = "edit",
}) => {
  const formatLastSaved = (date: Date | null): string => {
    if (!date) return "";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1)
      return mode === "create" ? "Draft saved just now" : "Saved just now";
    if (diffMins === 1)
      return mode === "create"
        ? "Draft saved 1 minute ago"
        : "Saved 1 minute ago";
    if (diffMins < 60)
      return mode === "create"
        ? `Draft saved ${diffMins} minutes ago`
        : `Saved ${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1)
      return mode === "create" ? "Draft saved 1 hour ago" : "Saved 1 hour ago";
    if (diffHours < 24)
      return mode === "create"
        ? `Draft saved ${diffHours} hours ago`
        : `Saved ${diffHours} hours ago`;

    return mode === "create"
      ? `Draft saved on ${date.toLocaleDateString()}`
      : `Saved on ${date.toLocaleDateString()}`;
  };

  const getTitle = () => {
    return mode === "create" ? "Create Recipe" : "Edit Recipe";
  };

  const getSaveButtonText = () => {
    if (isSaving) {
      return mode === "create" ? "Creating" : "Saving";
    }
    return mode === "create" ? "Create" : "Save";
  };

  const getDeleteButtonText = () => {
    return mode === "create" ? "Discard" : "Delete";
  };

  const getStatusText = () => {
    if (isSaving) {
      return mode === "create" ? "Creating..." : "Saving...";
    }
    if (isDirty) {
      return mode === "create" ? "Unsaved changes" : "Unsaved changes";
    }
    return "";
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isSaving}
        >
          <Ionicons name="close" size={24} color={colors.gray[600]} />
        </TouchableOpacity>

        <View style={styles.titleSection}>
          <Text style={styles.title}>{getTitle()}</Text>
          {isSaving ? (
            <View style={styles.statusContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          ) : isDirty ? (
            <View style={styles.statusContainer}>
              <View style={styles.unsavedDot} />
              <Text style={styles.statusText}>{getStatusText()}</Text>
            </View>
          ) : lastSaved ? (
            <Text style={styles.savedText}>{formatLastSaved(lastSaved)}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          disabled={isSaving}
          accessibilityLabel={getDeleteButtonText()}
        >
          <Ionicons
            name={mode === "create" ? "trash-outline" : "trash-outline"}
            size={20}
            color={colors.red[500]}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveButton,
            isDirty ? styles.saveButtonActive : styles.saveButtonDisabled,
          ]}
          onPress={onSave}
          disabled={!isDirty || isSaving}
          accessibilityLabel={getSaveButtonText()}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="checkmark" size={20} color={colors.white} />
          )}
          <Text style={styles.saveButtonText}>{getSaveButtonText()}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    ...createShadow(2, 0.1, 4),
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  cancelButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700",
    color: colors.dark,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  statusText: {
    fontSize: typography.fontSizes.xs,
    color: colors.gray[500],
    marginLeft: spacing.xs,
  },
  savedText: {
    fontSize: typography.fontSizes.xs,
    color: colors.green[600],
    marginTop: 2,
  },
  unsavedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: "center",
  },
  saveButtonActive: {
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.fontSizes.sm,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
});

export default EditHeader;
