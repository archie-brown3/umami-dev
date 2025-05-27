import React from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../../utils/styleUtils";

/**
 * UserMenu component that displays user information and actions
 * Shown in the header when a user is authenticated
 */
export default function UserMenu() {
  const { user, signOut } = useAuth();

  // If not authenticated, show sign in button
  if (!user) {
    return (
      <Pressable style={styles.signInButton}>
        <Text style={styles.signInText}>Sign In</Text>
      </Pressable>
    );
  }

  // Generate avatar initials from email
  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : "US";

  // Enhanced signOut with error handling
  const handleSignOut = async () => {
    try {
      console.log("Signing out user...");
      await signOut();
      console.log("Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userEmail} numberOfLines={1}>
          {user.email}
        </Text>
      </View>

      <Pressable style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color={colors.red[500]} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: colors.white,
    fontSize: typography.fontSizes.sm,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: typography.fontSizes.sm,
    color: colors.dark,
    flex: 1,
  },
  signInButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  signInText: {
    color: colors.white,
    fontSize: typography.fontSizes.sm,
    fontWeight: "600",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  signOutText: {
    color: colors.red[500],
    fontSize: typography.fontSizes.sm,
    fontWeight: "500",
  },
});
