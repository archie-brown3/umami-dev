import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSubscription } from "@/context/SubscriptionContext";
import { colors, spacing, borderRadius } from "@/utils/styleUtils";

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  feature?: string;
}

export const Paywall: React.FC<PaywallProps> = ({
  visible,
  onClose,
  feature = "Premium Features",
}) => {
  const { offerings, purchasePackage, restorePurchases, isLoading } =
    useSubscription();

  const handlePurchase = async (packageToPurchase: any) => {
    const success = await purchasePackage(packageToPurchase);
    if (success) {
      onClose();
    }
  };

  const handleRestore = async () => {
    await restorePurchases();
  };

  if (!offerings) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.gray[400]} />
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
              Loading subscription options...
            </Text>
          </View>
        </View>
      </Modal>
    );
  }

  const monthlyPackage = offerings.monthly;
  const annualPackage = offerings.annual;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.gray[400]} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.heroSection}>
            <Ionicons
              name="restaurant"
              size={64}
              color={colors.primary}
              style={styles.heroIcon}
            />
            <Text style={styles.title}>Unlock {feature}</Text>
            <Text style={styles.subtitle}>
              Get unlimited access to all premium recipe features
            </Text>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Premium Features:</Text>
            <View style={styles.featuresList}>
              <FeatureItem icon="infinite" text="Unlimited recipe storage" />
              <FeatureItem icon="calendar" text="Advanced meal planning" />
              <FeatureItem icon="list" text="Smart shopping lists" />
              <FeatureItem icon="scan" text="Recipe text extraction" />
              <FeatureItem icon="cloud" text="Cross-device sync" />
              <FeatureItem icon="download" text="Export recipes" />
            </View>
          </View>

          <View style={styles.packagesSection}>
            {annualPackage && (
              <TouchableOpacity
                style={[styles.packageButton, styles.popularPackage]}
                onPress={() => handlePurchase(annualPackage)}
                disabled={isLoading}
              >
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                </View>
                <Text style={styles.packageTitle}>Annual Plan</Text>
                <Text style={styles.packagePrice}>
                  {annualPackage.product.priceString}/year
                </Text>
                <Text style={styles.packageSavings}>Save 50%!</Text>
              </TouchableOpacity>
            )}

            {monthlyPackage && (
              <TouchableOpacity
                style={styles.packageButton}
                onPress={() => handlePurchase(monthlyPackage)}
                disabled={isLoading}
              >
                <Text style={styles.packageTitle}>Monthly Plan</Text>
                <Text style={styles.packagePrice}>
                  {monthlyPackage.product.priceString}/month
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isLoading}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>

          <Text style={styles.termsText}>
            Subscriptions auto-renew unless cancelled. You can cancel anytime in
            Settings.
          </Text>
        </ScrollView>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.white} />
          </View>
        )}
      </View>
    </Modal>
  );
};

const FeatureItem: React.FC<{ icon: string; text: string }> = ({
  icon,
  text,
}) => (
  <View style={styles.featureItem}>
    <Ionicons name={icon as any} size={20} color={colors.primary} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    padding: spacing.lg,
  },
  heroSection: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  heroIcon: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: spacing.sm,
    color: colors.dark,
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    color: colors.gray[500],
    lineHeight: 24,
  },
  featuresSection: {
    marginBottom: spacing.xl,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: spacing.md,
    color: colors.dark,
  },
  featuresList: {
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  featureText: {
    fontSize: 16,
    color: colors.dark,
  },
  packagesSection: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  packageButton: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.gray[200],
  },
  popularPackage: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  popularBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  popularBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: spacing.xs,
    color: colors.dark,
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.dark,
  },
  packageSavings: {
    fontSize: 14,
    color: colors.green[500],
    fontWeight: "600",
    marginTop: spacing.xs,
  },
  restoreButton: {
    alignItems: "center",
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  restoreButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  termsText: {
    fontSize: 12,
    color: colors.gray[500],
    textAlign: "center",
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: colors.gray[500],
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
