import React from "react";
import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "fade",
        ...(Platform.OS === "ios"
          ? {
              headerStyle: {
                backgroundColor: "transparent",
              },
              contentStyle: {
                backgroundColor: "transparent",
              },
            }
          : {}),
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
