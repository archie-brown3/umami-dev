import React from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import { colors, spacing, typography } from "@/utils/styleUtils"; // Assuming you have these defined

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      // AuthProvider and RootLayoutNav should handle redirecting to login
      // If not, uncomment the line below:
      // router.replace('/(auth)/login');
    } catch (error) {
      console.error("Error signing out: ", error);
      Alert.alert("Sign Out Error", "Failed to sign out. Please try again.");
    }
  };

  if (!user) {
    // This case should ideally be handled by the root navigator redirecting to login
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.text}>Loading user information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>My Profile</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.infoText}>{user.email}</Text>
        </View>
        {/* Add more user details here if needed */}
        {/* e.g., <Text>User ID: {user.id}</Text> */}
        <View style={styles.buttonContainer}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            color={colors.primary}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: "bold",
    color: colors.dark,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  infoContainer: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
  },
  label: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  infoText: {
    fontSize: typography.fontSizes.md,
    color: colors.dark,
  },
  text: {
    fontSize: typography.fontSizes.md,
    color: colors.gray[700],
  },
  buttonContainer: {
    marginTop: "auto", // Pushes the button to the bottom
    paddingTop: spacing.lg,
  },
});
