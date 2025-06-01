import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import RevenueCatUI from "react-native-purchases-ui";
import Purchases from "react-native-purchases";
import { colors } from "@/utils/styleUtils";
import { useSubscription } from "@/context/SubscriptionContext";

interface RevenueCatPaywallTestProps {
  visible: boolean;
  onClose: () => void;
}

export const RevenueCatPaywallTest: React.FC<RevenueCatPaywallTestProps> = ({
  visible,
  onClose,
}) => {
  const { isPremium, offerings, purchasePackage } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<{
    sdkConfigured: boolean;
    customerInfo: any;
    offeringsLoaded: boolean;
    error?: string;
  } | null>(null);

  // Run comprehensive test on mount
  useEffect(() => {
    if (visible) {
      runComprehensiveTest();
    }
  }, [visible]);

  const runComprehensiveTest = async () => {
    console.log("🧪 Starting RevenueCat SDK Test...");

    try {
      // Test 1: Check if SDK is configured
      console.log("📱 Testing SDK configuration...");
      const isConfigured = await Purchases.isConfigured();
      console.log(`SDK Configured: ${isConfigured}`);

      // Test 2: Get customer info
      console.log("👤 Fetching customer info...");
      const customerInfo = await Purchases.getCustomerInfo();
      console.log("Customer Info:", {
        originalAppUserId: customerInfo.originalAppUserId,
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
        allEntitlements: Object.keys(customerInfo.entitlements.all),
      });

      // Test 3: Check offerings
      console.log("💰 Fetching offerings...");
      const fetchedOfferings = await Purchases.getOfferings();
      console.log("Offerings:", {
        current: fetchedOfferings.current?.identifier,
        allOfferings: Object.keys(fetchedOfferings.all),
        packagesInCurrent:
          fetchedOfferings.current?.availablePackages.length || 0,
      });

      // Test 4: Check premium status
      console.log("⭐ Checking premium status...");
      const hasPremiumAccess =
        customerInfo.entitlements.active["premium_access"] !== undefined;
      console.log(`Premium Access: ${hasPremiumAccess}`);

      setTestResults({
        sdkConfigured: isConfigured,
        customerInfo: {
          userId: customerInfo.originalAppUserId,
          activeEntitlements: Object.keys(customerInfo.entitlements.active),
          isPremium: hasPremiumAccess,
        },
        offeringsLoaded: !!fetchedOfferings.current,
      });

      console.log("✅ RevenueCat SDK Test completed successfully!");
    } catch (error) {
      console.error("❌ RevenueCat SDK Test failed:", error);
      setTestResults({
        sdkConfigured: false,
        customerInfo: null,
        offeringsLoaded: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const handlePurchaseCompleted = () => {
    Alert.alert(
      "Purchase Successful!",
      "Welcome to Premium! The RevenueCat SDK is working correctly.",
      [{ text: "OK", onPress: onClose }]
    );
  };

  const handlePurchaseError = (error: any) => {
    console.log("[RevenueCat Test] Purchase error:", error);
    if (!error.userCancelled) {
      Alert.alert("Purchase Failed", error.message || "Something went wrong");
    }
  };

  const handleRestoreCompleted = () => {
    Alert.alert(
      "Restore Completed",
      isPremium
        ? "Premium subscription restored!"
        : "No purchases found to restore"
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>RevenueCat SDK Test</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>SDK Configuration Test</Text>
        <Text style={styles.description}>
          This tests your RevenueCat SDK setup and shows real data from your
          configuration.
        </Text>

        {/* Test Results */}
        {testResults && (
          <View style={styles.testResultsContainer}>
            <View style={styles.testItem}>
              <Text style={styles.testLabel}>SDK Configured:</Text>
              <Text
                style={[
                  styles.testValue,
                  testResults.sdkConfigured ? styles.success : styles.error,
                ]}
              >
                {testResults.sdkConfigured ? "YES ✅" : "NO ❌"}
              </Text>
            </View>

            <View style={styles.testItem}>
              <Text style={styles.testLabel}>Customer Info:</Text>
              <Text
                style={[
                  styles.testValue,
                  testResults.customerInfo ? styles.success : styles.error,
                ]}
              >
                {testResults.customerInfo ? "LOADED ✅" : "FAILED ❌"}
              </Text>
            </View>

            {testResults.customerInfo && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsText}>
                  User ID: {testResults.customerInfo.userId}
                </Text>
                <Text style={styles.detailsText}>
                  Active Entitlements:{" "}
                  {testResults.customerInfo.activeEntitlements.length > 0
                    ? testResults.customerInfo.activeEntitlements.join(", ")
                    : "None"}
                </Text>
                <Text style={styles.detailsText}>
                  Premium Status:{" "}
                  {testResults.customerInfo.isPremium ? "PREMIUM ⭐" : "FREE"}
                </Text>
              </View>
            )}

            <View style={styles.testItem}>
              <Text style={styles.testLabel}>Offerings Loaded:</Text>
              <Text
                style={[
                  styles.testValue,
                  testResults.offeringsLoaded ? styles.success : styles.error,
                ]}
              >
                {testResults.offeringsLoaded ? "YES ✅" : "NO ❌"}
              </Text>
            </View>

            {offerings && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsText}>
                  Current Offering: "{offerings.identifier}"
                </Text>
                <Text style={styles.detailsText}>
                  Available Packages: {offerings.availablePackages.length}
                </Text>
                {offerings.availablePackages.map((pkg, index) => (
                  <Text key={index} style={styles.packageText}>
                    • {pkg.identifier}: {pkg.product.title}
                  </Text>
                ))}
              </View>
            )}

            {testResults.error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorText}>{testResults.error}</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={runComprehensiveTest}
          >
            <Text style={styles.actionButtonText}>Re-run Test</Text>
          </TouchableOpacity>

          {offerings && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() => {
                Alert.alert(
                  "Test RevenueCat Paywall",
                  "This will open the actual RevenueCat paywall for testing. Only proceed if you want to test the purchase flow.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Open Paywall",
                      onPress: () => {
                        // This will show RevenueCat's built-in paywall
                        RevenueCatUI.presentPaywall({
                          offering: offerings,
                        })
                          .then((result) => {
                            console.log("Paywall result:", result);
                          })
                          .catch((error) => {
                            console.error("Paywall error:", error);
                          });
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.primaryButtonText}>
                Test Built-in Paywall
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.notesContainer}>
          <Text style={styles.notesTitle}>Test Notes:</Text>
          <Text style={styles.notesText}>
            • If SDK is configured and offerings are loaded, your setup is
            working correctly
          </Text>
          <Text style={styles.notesText}>
            • Test the built-in paywall to verify purchase flow (Sandbox mode)
          </Text>
          <Text style={styles.notesText}>
            • Check console logs for detailed information
          </Text>
          <Text style={styles.notesText}>
            • Free users should see feature limits enforced
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.gray[900],
  },
  closeButton: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    borderRadius: 15,
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.gray[600],
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.gray[800],
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: 20,
  },
  testResultsContainer: {
    marginBottom: 20,
  },
  testItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  testLabel: {
    fontSize: 14,
    color: colors.gray[700],
    fontWeight: "500",
  },
  testValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  success: {
    color: colors.green[600],
  },
  error: {
    color: colors.red[600],
  },
  detailsContainer: {
    marginTop: 10,
  },
  detailsText: {
    fontSize: 12,
    color: colors.gray[600],
  },
  packageText: {
    fontSize: 12,
    color: colors.gray[600],
    marginLeft: 10,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    backgroundColor: colors.gray[500],
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
  },
  notesContainer: {
    marginTop: 20,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.gray[800],
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  errorContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: colors.red[500],
    borderRadius: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.red[600],
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.red[600],
  },
});
