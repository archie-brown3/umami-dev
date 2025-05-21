import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { usePathname, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NetworkStatusBar } from "./NetworkStatusBar";
import { colors } from "../../utils/styleUtils";
import { SafeAreaView } from "react-native-safe-area-context";

interface LayoutProps {
  children: React.ReactNode;
  hideHeader?: boolean;
}

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
    <View style={styles.container}>
      {/* Network Status Bar - visible when offline */}
      <NetworkStatusBar />

      {!hideHeader && (
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Pressable
              onPress={() => navigate("/")}
              style={styles.titleContainer}
            >
              <Text style={styles.title}>Recipe Saver</Text>
            </Pressable>

            <View style={styles.headerActions}>
              <Pressable
                style={styles.headerButton}
                onPress={() => navigate("/search")}
              >
                <Ionicons name="search" size={20} color={colors.dark} />
              </Pressable>

              <Pressable
                style={styles.headerButton}
                onPress={() => navigate("/profile")}
              >
                <Ionicons name="person-circle" size={20} color={colors.dark} />
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* Main Content */}
      <View style={[styles.main, !hideHeader && styles.mainWithHeader]}>
        {children}
      </View>

      {/* Add Button (FAB) */}
      {shouldShowFab && <AddButton />}
    </View>
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
});

export default Layout;
