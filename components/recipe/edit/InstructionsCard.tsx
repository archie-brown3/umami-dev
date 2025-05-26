import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { VALIDATION_LIMITS } from "@/utils/recipeValidation";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  createShadow,
} from "@/utils/styleUtils";

interface InstructionsCardProps {
  instructions: string[];
  onAdd: () => void;
  onUpdate: (index: number, instruction: string) => void;
  onRemove: (index: number) => void;
  error?: string;
}

const InstructionsCard: React.FC<InstructionsCardProps> = ({
  instructions,
  onAdd,
  onUpdate,
  onRemove,
  error,
}) => {
  const canAddMore = instructions.length < VALIDATION_LIMITS.INSTRUCTIONS.max;

  const handleRemoveInstruction = (index: number) => {
    if (instructions.length <= 1) {
      Alert.alert(
        "Cannot Remove",
        "A recipe must have at least one instruction."
      );
      return;
    }

    Alert.alert(
      "Remove Step",
      `Are you sure you want to remove step ${index + 1}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => onRemove(index),
        },
      ]
    );
  };

  const renderInstruction = ({
    item,
    index,
  }: {
    item: string;
    index: number;
  }) => {
    const isValid = item.trim().length > 0;
    const charCount = item.length;
    const isOverLimit = charCount > VALIDATION_LIMITS.INSTRUCTION_TEXT.max;

    return (
      <View style={styles.instructionRow}>
        <View style={styles.stepNumber}>
          <Text style={styles.stepNumberText}>{index + 1}</Text>
        </View>

        <View style={styles.instructionContainer}>
          <TextInput
            style={[
              styles.instructionInput,
              !isValid && styles.inputError,
              isOverLimit && styles.inputOverLimit,
            ]}
            value={item}
            onChangeText={(text) => onUpdate(index, text)}
            placeholder={`Step ${index + 1} instructions...`}
            multiline
            numberOfLines={3}
            maxLength={VALIDATION_LIMITS.INSTRUCTION_TEXT.max}
            textAlignVertical="top"
            returnKeyType="next"
            autoCapitalize="sentences"
          />

          {/* Character count */}
          <Text
            style={[styles.charCount, isOverLimit && styles.charCountError]}
          >
            {charCount}/{VALIDATION_LIMITS.INSTRUCTION_TEXT.max}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveInstruction(index)}
          disabled={instructions.length <= 1}
        >
          <Ionicons
            name="close-circle"
            size={24}
            color={
              instructions.length <= 1 ? colors.gray[300] : colors.red[500]
            }
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          Instructions ({instructions.length}/
          {VALIDATION_LIMITS.INSTRUCTIONS.max})
        </Text>
        {canAddMore && (
          <TouchableOpacity style={styles.addButton} onPress={onAdd}>
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={styles.addButtonText}>Add Step</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={instructions}
        renderItem={renderInstruction}
        keyExtractor={(item, index) => `instruction-${index}`}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />

      {!canAddMore && (
        <Text style={styles.limitText}>
          Maximum {VALIDATION_LIMITS.INSTRUCTIONS.max} instructions allowed
        </Text>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {canAddMore && (
        <TouchableOpacity style={styles.addMoreButton} onPress={onAdd}>
          <Ionicons
            name="add-circle-outline"
            size={24}
            color={colors.primary}
          />
          <Text style={styles.addMoreText}>Add Another Step</Text>
        </TouchableOpacity>
      )}

      {/* Helpful tips */}
      <View style={styles.tipsContainer}>
        <Ionicons name="bulb-outline" size={16} color={colors.gray[500]} />
        <Text style={styles.tipsText}>
          Tip: Be specific with cooking times, temperatures, and techniques for
          best results.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...createShadow(2, 0.1, 8),
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700",
    color: colors.dark,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary + "20",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary,
    fontWeight: "600",
    marginLeft: spacing.xs,
  },
  instructionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.sm,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  stepNumberText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "700",
    color: colors.primary,
  },
  instructionContainer: {
    flex: 1,
    marginRight: spacing.sm,
  },
  instructionInput: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSizes.md,
    color: colors.dark,
    backgroundColor: colors.white,
    minHeight: 80,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: colors.red[500],
    borderWidth: 2,
  },
  inputOverLimit: {
    borderColor: colors.orange[500],
    borderWidth: 2,
  },
  charCount: {
    fontSize: typography.fontSizes.xs,
    color: colors.gray[400],
    textAlign: "right",
    marginTop: spacing.xs,
  },
  charCountError: {
    color: colors.red[500],
  },
  removeButton: {
    padding: spacing.xs,
    marginTop: spacing.xs,
  },
  separator: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: spacing.sm,
  },
  addMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: "dashed",
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  addMoreText: {
    fontSize: typography.fontSizes.md,
    color: colors.primary,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
  limitText: {
    fontSize: typography.fontSizes.xs,
    color: colors.gray[500],
    textAlign: "center",
    marginTop: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.red[500],
    marginTop: spacing.sm,
  },
  tipsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.blue[50],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  tipsText: {
    fontSize: typography.fontSizes.xs,
    color: colors.gray[600],
    marginLeft: spacing.xs,
    flex: 1,
    lineHeight: 16,
  },
});

export default InstructionsCard;
