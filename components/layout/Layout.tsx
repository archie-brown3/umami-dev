import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { usePathname, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../utils/styleUtils";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";

interface LayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

// Check if we're in tunnel mode (exp.direct domain)
const isTunnelMode =
  Constants.expoConfig?.hostUri?.includes("exp.direct") ||
  Constants.experienceUrl?.includes("exp.direct");

const Layout: React.FC<LayoutProps> = ({ children, hideHeader = true }) => {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // Check if the path is active
  const isActive = (path: string) => {
    return pathname === path;
  };

  // Hide FAB on recipe detail and add recipe pages
  const shouldShowFab =
    !pathname.includes("/recipe/") &&
    !pathname.includes("/add-recipe") &&
    !pathname.includes("/edit-recipe");

  // Navigate to a route
  const navigate = (route: string) => {
    router.push(route as any);
  };

  // Add Button Component
  const AddButton = () => {
    if (!shouldShowFab) return null;

    return (
      <Pressable
        style={styles.addButton}
        onPress={() => {
          router.push({
            pathname: "/add-recipe",
            params: {
              tab: "instagram",
              presentationStyle: "modal",
            },
          });
        }}
        android_ripple={{ color: colors.primary }}
      >
        <Ionicons name="add" size={24} color={colors.white} />
      </Pressable>
    );
  };

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.white }]}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          {children}
        </ScrollView>
        {isTunnelMode && pathname === "/(tabs)" && (
          <Pressable
            style={styles.apiTestButton}
            onPress={() => router.push("/api-test")}
          >
            <Ionicons name="wifi" size={16} color={colors.white} />
            <Text style={styles.apiTestButtonText}>API Test</Text>
          </Pressable>
        )}
      </View>
      <StatusBar style="auto" />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    padding: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.primary,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
  },
  main: {
    flex: 1,
    padding: 16,
  },
  mainWithHeader: {
    paddingTop: 8,
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollView: {
    flexGrow: 1,
  },
  apiTestButton: {
    position: "absolute",
    bottom: 24,
    left: 24,
    padding: 12,
    borderRadius: 20,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
  },
  apiTestButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.white,
    marginLeft: 8,
  },
});

export default Layout;
