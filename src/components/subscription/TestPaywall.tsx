import React from "react";
import { View, Button, Text, StyleSheet } from "react-native";
import { useSubscription } from "@/context/SubscriptionContext";

export const TestPaywall = () => {
  const {
    isPremium,
    isLoading,
    presentPaywall,
    presentPaywallIfNeeded,
    restorePurchases,
    getRemainingRecipeCount,
  } = useSubscription();

  const handleShowPaywall = async () => {
    console.log("[TestPaywall] Showing paywall directly");
    const result = await presentPaywall();
    console.log("[TestPaywall] Paywall result:", result);
  };

  const handleTestFeature = async () => {
    console.log("[TestPaywall] Testing premium feature");
    const result = await presentPaywallIfNeeded("recipe_url_extraction");
    console.log("[TestPaywall] Feature access result:", result);
  };

  const handleRestore = async () => {
    console.log("[TestPaywall] Restoring purchases");
    const result = await restorePurchases();
    console.log("[TestPaywall] Restore result:", result);
  };

  if (isLoading) {
    return <Text style={styles.text}>Loading subscription status...</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Subscription Status: {isPremium ? "Premium" : "Free"}
      </Text>

      {!isPremium && (
        <Text style={styles.text}>
          Remaining Recipes: {getRemainingRecipeCount()}
        </Text>
      )}

      <View style={styles.buttonContainer}>
        <Button title="Show Paywall" onPress={handleShowPaywall} />

        <Button title="Test Premium Feature" onPress={handleTestFeature} />

        <Button title="Restore Purchases" onPress={handleRestore} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  text: {
    fontSize: 16,
    marginBottom: 20,
  },
  buttonContainer: {
    gap: 10,
    width: "100%",
  },
});
