import React from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/utils/styleUtils";

// Example 1: Recipe Save Button with Limit Check
export const RecipeSaveButton = ({
  onSave,
  currentRecipeCount = 0,
}: {
  onSave: () => void;
  currentRecipeCount?: number;
}) => {
  const { canAddRecipe } = useFeatureGating();
  const { hasAccess, remaining, showPaywall } =
    canAddRecipe(currentRecipeCount);

  const handleSave = () => {
    if (hasAccess) {
      onSave();
    } else {
      showPaywall();
    }
  };

  return (
    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
      <Ionicons name="bookmark" size={20} color="white" />
      <Text style={styles.saveButtonText}>
        Save Recipe {remaining !== -1 && `(${remaining} left)`}
      </Text>
    </TouchableOpacity>
  );
};

// Example 2: Text Recognition Feature
export const TextRecognitionButton = ({ onScan }: { onScan: () => void }) => {
  const { canUseTextRecognition } = useFeatureGating();
  const { hasAccess, showPaywall } = canUseTextRecognition();

  const handleScan = () => {
    if (hasAccess) {
      onScan();
    } else {
      showPaywall();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.featureButton, !hasAccess && styles.disabledButton]}
      onPress={handleScan}
    >
      <Ionicons
        name={hasAccess ? "camera" : "lock-closed"}
        size={20}
        color={hasAccess ? colors.primary : colors.gray[400]}
      />
      <Text style={[styles.buttonText, !hasAccess && styles.disabledText]}>
        {hasAccess ? "Scan Recipe" : "Scan Recipe (Premium)"}
      </Text>
    </TouchableOpacity>
  );
};

// Example 3: PDF Export with Feature Gate
export const PDFExportButton = ({ recipeData }: { recipeData: any }) => {
  const { canExportToPDF } = useFeatureGating();
  const { hasAccess, showPaywall } = canExportToPDF();

  const handleExport = () => {
    if (hasAccess) {
      // Implement PDF export logic
      Alert.alert("Success", "Recipe exported to PDF!");
    } else {
      showPaywall();
    }
  };

  return (
    <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
      <Ionicons
        name={hasAccess ? "document" : "lock-closed"}
        size={16}
        color={hasAccess ? colors.blue[600] : colors.gray[400]}
      />
      <Text style={[styles.exportText, !hasAccess && styles.disabledText]}>
        Export PDF {!hasAccess && "(Premium)"}
      </Text>
    </TouchableOpacity>
  );
};

// Example 4: Meal Planning with Week Limits
export const MealPlanningWeekSelector = ({
  selectedWeek,
  onWeekChange,
}: {
  selectedWeek: number;
  onWeekChange: (week: number) => void;
}) => {
  const { canUseMealPlanning, limits } = useFeatureGating();

  const weeks = Array.from(
    { length: limits.mealPlanning.maxWeeksAhead + 1 },
    (_, i) => i
  );

  return (
    <View style={styles.weekSelector}>
      <Text style={styles.sectionTitle}>Plan Your Meals</Text>
      <View style={styles.weekButtons}>
        {weeks.map((week) => {
          const { hasAccess, showPaywall } = canUseMealPlanning(week);

          return (
            <TouchableOpacity
              key={week}
              style={[
                styles.weekButton,
                selectedWeek === week && styles.selectedWeek,
                !hasAccess && styles.disabledButton,
              ]}
              onPress={() => {
                if (hasAccess) {
                  onWeekChange(week);
                } else {
                  showPaywall();
                }
              }}
            >
              <Text
                style={[
                  styles.weekButtonText,
                  selectedWeek === week && styles.selectedWeekText,
                  !hasAccess && styles.disabledText,
                ]}
              >
                {week === 0 ? "This Week" : `Week +${week}`}
                {!hasAccess && " 🔒"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// Example 5: Feature Gate Wrapper Component
export const PremiumFeatureWrapper = ({
  feature,
  children,
  fallbackMessage = "This feature requires Premium",
}: {
  feature: any;
  children: React.ReactNode;
  fallbackMessage?: string;
}) => {
  const { withFeatureGate } = useFeatureGating();

  const premiumPrompt = (
    <View style={styles.premiumPrompt}>
      <Ionicons name="star" size={24} color={colors.orange[500]} />
      <Text style={styles.premiumText}>{fallbackMessage}</Text>
      <TouchableOpacity style={styles.upgradeButton}>
        <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
      </TouchableOpacity>
    </View>
  );

  return withFeatureGate(feature, children, premiumPrompt);
};

const styles = StyleSheet.create({
  saveButton: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonText: {
    color: "white",
    fontWeight: "600",
  },
  featureButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: 8,
  },
  disabledButton: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[300],
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.gray[800],
  },
  disabledText: {
    color: colors.gray[400],
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  exportText: {
    fontSize: 14,
    color: colors.blue[600],
    fontWeight: "500",
  },
  weekSelector: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: colors.gray[800],
  },
  weekButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  weekButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: "white",
  },
  selectedWeek: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weekButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.gray[600],
  },
  selectedWeekText: {
    color: "white",
  },
  premiumPrompt: {
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.orange[500] + "20",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.orange[500] + "40",
  },
  premiumText: {
    fontSize: 16,
    color: colors.gray[700],
    marginVertical: 8,
    textAlign: "center",
  },
  upgradeButton: {
    backgroundColor: colors.orange[500],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  upgradeButtonText: {
    color: "white",
    fontWeight: "600",
  },
});
