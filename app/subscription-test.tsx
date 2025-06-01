import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSubscription } from "@/context/SubscriptionContext";
import { Paywall } from "@/components/subscription/Paywall";
import { colors, spacing, borderRadius } from "@/utils/styleUtils";

export default function SubscriptionTestScreen() {
  const [paywallVisible, setPaywallVisible] = useState(false);
  const {
    isPremium,
    isLoading,
    customerInfo,
    offerings,
    restorePurchases,
    checkSubscriptionStatus,
  } = useSubscription();

  const handleShowPaywall = () => {
    setPaywallVisible(true);
  };

  const handleRestore = async () => {
    await restorePurchases();
  };

  const handleRefresh = async () => {
    await checkSubscriptionStatus();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="card" size={48} color={colors.primary} />
          <Text style={styles.title}>RevenueCat Test</Text>
          <Text style={styles.subtitle}>Test subscription functionality</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>Subscription Status</Text>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Premium Status:</Text>
            <View
              style={[
                styles.badge,
                isPremium ? styles.premiumBadge : styles.freeBadge,
              ]}
            >
              <Text style={styles.badgeText}>
                {isPremium ? "PREMIUM" : "FREE"}
              </Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Loading:</Text>
            <Text style={styles.statusValue}>{isLoading ? "Yes" : "No"}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Offerings Available:</Text>
            <Text style={styles.statusValue}>{offerings ? "Yes" : "No"}</Text>
          </View>

          {customerInfo && (
            <View style={styles.customerInfo}>
              <Text style={styles.infoTitle}>Customer Info:</Text>
              <Text style={styles.infoText}>
                User ID: {customerInfo.originalAppUserId}
              </Text>
              <Text style={styles.infoText}>
                Active Entitlements:{" "}
                {Object.keys(customerInfo.entitlements.active).length}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>Test Actions</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShowPaywall}
            disabled={isLoading}
          >
            <Ionicons name="card-outline" size={24} color={colors.white} />
            <Text style={styles.actionButtonText}>Show Paywall</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleRestore}
            disabled={isLoading}
          >
            <Ionicons name="refresh-outline" size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              Restore Purchases
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleRefresh}
            disabled={isLoading}
          >
            <Ionicons name="sync-outline" size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
              Refresh Status
            </Text>
          </TouchableOpacity>
        </View>

        {offerings && (
          <View style={styles.offeringsCard}>
            <Text style={styles.cardTitle}>Available Products</Text>
            {offerings.monthly && (
              <View style={styles.productItem}>
                <Text style={styles.productTitle}>Monthly Subscription</Text>
                <Text style={styles.productPrice}>
                  {offerings.monthly.product.priceString}
                </Text>
              </View>
            )}
            {offerings.annual && (
              <View style={styles.productItem}>
                <Text style={styles.productTitle}>Annual Subscription</Text>
                <Text style={styles.productPrice}>
                  {offerings.annual.product.priceString}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.instructionsCard}>
          <Text style={styles.cardTitle}>Testing Instructions</Text>
          <Text style={styles.instructionText}>
            1. Tap "Show Paywall" to test subscription flow
          </Text>
          <Text style={styles.instructionText}>
            2. Use sandbox Apple ID for testing
          </Text>
          <Text style={styles.instructionText}>
            3. Check console logs for RevenueCat debugging
          </Text>
          <Text style={styles.instructionText}>
            4. Test "Restore Purchases" functionality
          </Text>
        </View>
      </ScrollView>

      <Paywall
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        feature="Test Premium Features"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.dark,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  statusCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 16,
    color: colors.gray[600],
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.dark,
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  premiumBadge: {
    backgroundColor: colors.green[500],
  },
  freeBadge: {
    backgroundColor: colors.gray[400],
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  customerInfo: {
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: 12,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  actionsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  offeringsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.dark,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },
  instructionsCard: {
    backgroundColor: colors.blue[50],
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  instructionText: {
    fontSize: 14,
    color: colors.gray[700],
    lineHeight: 20,
  },
});
