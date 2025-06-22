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
import { supabase } from "@/lib/supabase";
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
        // On simulator, we need to check if we're running iOS 18.4
        const isSimulator =
          Constants.appOwnership === "expo" ||
          Constants.executionEnvironment === "storeClient";
        const iosVersion =
          Platform.OS === "ios"
            ? NativeModules.PlatformConstants?.osVersion
            : null;

        if (isSimulator && iosVersion?.startsWith("18.4")) {
          console.log(
            "Running on iOS 18.4 simulator - Apple Sign In may not work properly"
          );
          // We still show the button but warn the user
          setIsAvailable(true);
          return;
        }

        const available = await AppleAuthentication.isAvailableAsync();
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

      // Check if we're on iOS 18.4 simulator
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

      // Request credential from Apple
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error("No identity token received from Apple");
      }

      // Sign in with Supabase using the Apple credential
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error("No user data received from Supabase");
      }

      // If we have user info from Apple, update the Supabase user profile
      if (credential.fullName) {
        const { givenName, familyName } = credential.fullName;
        if (givenName || familyName) {
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
