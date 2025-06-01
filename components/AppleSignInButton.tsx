import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAuth } from "@/context/AuthContext";
import { colors, spacing } from "@/utils/styleUtils";
import { supabase } from "@/lib/supabase";

interface AppleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  style?: any;
}

export default function AppleSignInButton({
  onSuccess,
  onError,
  style,
}: AppleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  // Check Apple Sign In availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      if (Platform.OS === "ios") {
        const available = await AppleAuthentication.isAvailableAsync();
        setIsAvailable(available);
      }
    };
    checkAvailability();
  }, []);

  // Don't render if not available
  if (Platform.OS !== "ios" || !isAvailable) {
    return null;
  }

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);

      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log("Apple credential received:", credential);

      // Check if we have the required token
      if (!credential.identityToken) {
        throw new Error("No identity token received from Apple");
      }

      // Sign in to Supabase with Apple ID token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });

      if (error) {
        console.error("Supabase Apple Sign In error:", error);
        throw error;
      }

      console.log("Successfully signed in with Apple:", data);
      onSuccess?.();
    } catch (error: any) {
      console.error("Apple Sign In error:", error);

      // Handle user cancellation gracefully
      if (error.code === "ERR_CANCELED") {
        console.log("Apple Sign In cancelled by user");
        return; // Don't show error for cancellation
      }

      // Show error for other cases
      Alert.alert(
        "Sign In Failed",
        error.message || "Failed to sign in with Apple. Please try again.",
        [{ text: "OK" }]
      );
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.appleButton, style]}
      onPress={handleAppleSignIn}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Ionicons name="logo-apple" size={20} color={colors.white} />
        )}
        <Text style={styles.appleButtonText}>
          {isLoading ? "Signing in..." : "Continue with Apple"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  appleButton: {
    backgroundColor: "#000000",
    borderRadius: 8,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.xs,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  appleButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
});
