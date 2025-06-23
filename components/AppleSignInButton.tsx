import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  View,
  NativeModules,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAuth } from "@/context/AuthContext";
import { colors, spacing } from "@/utils/styleUtils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import Constants from "expo-constants";

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
      try {
        // Check app environment
        const appOwnership = Constants.appOwnership;
        const executionEnvironment = Constants.executionEnvironment;

        console.log("[Apple Sign In] Environment check:", {
          appOwnership,
          executionEnvironment,
          isDev: __DEV__,
        });

        const available = await AppleAuthentication.isAvailableAsync();
        console.log("[Apple Sign In] Native availability:", available);

        setIsAvailable(available);
      } catch (error) {
        console.error("Error checking Apple Sign In availability:", error);
        setIsAvailable(false);
      }
    };
    checkAvailability();
  }, []);

  // Don't render if not available
  if (!isAvailable) {
    return null;
  }

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);

      // Check if Supabase is properly configured
      if (!isSupabaseConfigured()) {
        Alert.alert(
          "Authentication Not Available",
          "Apple Sign In is temporarily unavailable. Please try email/password authentication or contact support.",
          [{ text: "OK" }]
        );
        return;
      }

      // Check if we're on iOS 18.4 simulator (development issue)
      const isSimulator =
        Constants.appOwnership === "expo" ||
        Constants.executionEnvironment === "storeClient";
      const iosVersion =
        Platform.OS === "ios"
          ? NativeModules.PlatformConstants?.osVersion
          : null;

      if (isSimulator && iosVersion?.startsWith("18.4")) {
        Alert.alert(
          "Simulator Limitation",
          "Apple Sign In is not fully supported on iOS 18.4 simulator. Please test on a physical device or different iOS version.",
          [{ text: "OK" }]
        );
        return;
      }

      console.log("[Apple Sign In] Starting authentication process...");

      // Request credential from Apple
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log("[Apple Sign In] Received credential:", {
        hasIdentityToken: !!credential.identityToken,
        hasEmail: !!credential.email,
        hasFullName: !!credential.fullName,
      });

      if (!credential.identityToken) {
        throw new Error("No identity token received from Apple");
      }

      // Sign in with Supabase using the Apple credential
      console.log("[Apple Sign In] Authenticating with Supabase...");
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });

      if (error) {
        console.error("[Apple Sign In] Supabase authentication error:", error);
        throw error;
      }

      if (!data.user) {
        throw new Error("No user data received from Supabase");
      }

      console.log("[Apple Sign In] Supabase authentication successful");

      // If we have user info from Apple, update the Supabase user profile
      if (credential.fullName) {
        const { givenName, familyName } = credential.fullName;
        if (givenName || familyName) {
          console.log("[Apple Sign In] Updating user profile...");
          const { error: updateError } = await supabase
            .from("profiles")
            .upsert({
              id: data.user.id,
              first_name: givenName || "",
              last_name: familyName || "",
              updated_at: new Date().toISOString(),
            });

          if (updateError) {
            console.error("Error updating user profile:", updateError);
            // Don't throw here - profile update is optional
          } else {
            console.log("[Apple Sign In] Profile updated successfully");
          }
        }
      }

      console.log("Apple Sign In successful");
      onSuccess?.();
    } catch (error: any) {
      console.error("Apple Sign In error:", error);

      // Handle user cancellation gracefully
      if (error.code === "ERR_CANCELED") {
        console.log("Apple Sign In cancelled by user");
        return;
      }

      // Handle specific errors with helpful messages
      let errorMessage = "Failed to sign in with Apple. Please try again.";

      if (error.message?.includes("network")) {
        errorMessage =
          "Network error. Please check your internet connection and try again.";
      } else if (error.message?.includes("timeout")) {
        errorMessage = "The request timed out. Please try again.";
      } else if (error.message?.includes("Supabase")) {
        errorMessage =
          "Authentication service temporarily unavailable. Please try email/password sign in.";
      }

      // Show error for other cases
      Alert.alert("Sign In Failed", errorMessage, [{ text: "OK" }]);
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
    backgroundColor: "#000",
    borderRadius: 8,
    padding: spacing.md,
    width: "100%",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  appleButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: spacing.sm,
  },
});
