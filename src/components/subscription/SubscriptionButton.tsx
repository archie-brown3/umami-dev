import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from "react-native";
import { useSubscription } from "@/context/SubscriptionContext";

interface SubscriptionButtonProps {
  feature?: string;
  style?: any;
  textStyle?: any;
  children?: React.ReactNode;
}

export const SubscriptionButton: React.FC<SubscriptionButtonProps> = ({
  feature = "premium_access",
  style,
  textStyle,
  children,
}) => {
  const { isPremium, isLoading, presentPaywall } = useSubscription();

  const handlePress = async () => {
    if (isPremium) return;

    try {
      await presentPaywall(feature);
    } catch (error) {
      console.error("Error presenting paywall:", error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.button, styles.loadingButton, style]}>
        <ActivityIndicator size="small" color="#fff" />
        <Text style={[styles.buttonText, textStyle]}>Loading...</Text>
      </View>
    );
  }

  if (isPremium) {
    return (
      <View style={[styles.button, styles.premiumButton, style]}>
        <Text style={[styles.buttonText, styles.premiumText, textStyle]}>
          ✓ Premium Active
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, styles.upgradeButton, style]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {children || (
        <Text style={[styles.buttonText, textStyle]}>Upgrade to Premium</Text>
      )}
    </TouchableOpacity>
  );
};

// Quick access component for specific features
export const UpgradeForFeatureButton: React.FC<{
  feature: string;
  featureName: string;
  style?: any;
}> = ({ feature, featureName, style }) => {
  const { canAccessFeature, presentPaywall } = useSubscription();

  if (canAccessFeature(feature)) {
    return null; // Don't show button if user already has access
  }

  return (
    <TouchableOpacity
      style={[styles.featureButton, style]}
      onPress={() => presentPaywall(feature)}
      activeOpacity={0.8}
    >
      <Text style={styles.featureButtonText}>🔒 Unlock {featureName}</Text>
    </TouchableOpacity>
  );
};

// Subscription status component
export const SubscriptionStatus: React.FC<{ style?: any }> = ({ style }) => {
  const { isPremium, isLoading, getRemainingRecipeCount } = useSubscription();

  if (isLoading) {
    return (
      <View style={[styles.statusContainer, style]}>
        <ActivityIndicator size="small" color="#666" />
        <Text style={styles.statusText}>Checking subscription...</Text>
      </View>
    );
  }

  const remaining = getRemainingRecipeCount();

  return (
    <View style={[styles.statusContainer, style]}>
      <Text style={[styles.statusText, isPremium && styles.premiumStatus]}>
        {isPremium ? "✓ Premium Active" : `Free Plan (${remaining}/10 recipes)`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  loadingButton: {
    backgroundColor: "#ccc",
    gap: 8,
  },
  upgradeButton: {
    backgroundColor: "#007AFF",
  },
  premiumButton: {
    backgroundColor: "#34C759",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  premiumText: {
    color: "#fff",
  },
  featureButton: {
    backgroundColor: "#FF9500",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  featureButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 14,
    color: "#666",
  },
  premiumStatus: {
    color: "#34C759",
    fontWeight: "600",
  },
});
