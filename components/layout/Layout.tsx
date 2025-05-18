import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { usePathname, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NetworkStatusBar } from "./NetworkStatusBar";
import { colors } from "../../utils/styleUtils";

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
        android_ripple={{ color: colors.primaryDark }}
      >
        <Ionicons name="add" size={24} color={colors.white} />
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
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

      {/* Bottom Navigation */}
      <View
        style={[styles.navBar, { paddingBottom: Math.max(insets.bottom, 10) }]}
      >
        <Pressable style={styles.navItem} onPress={() => navigate("/")}>
          <Ionicons
            name={isActive("/") ? "home" : "home-outline"}
            size={22}
            color={isActive("/") ? colors.primary : colors.gray[500]}
          />
          <Text
            style={[styles.navLabel, isActive("/") && styles.activeNavLabel]}
          >
            Home
          </Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => navigate("/recipes")}>
          <Ionicons
            name={isActive("/recipes") ? "book" : "book-outline"}
            size={22}
            color={isActive("/recipes") ? colors.primary : colors.gray[500]}
          />
          <Text
            style={[
              styles.navLabel,
              isActive("/recipes") && styles.activeNavLabel,
            ]}
          >
            Recipes
          </Text>
        </Pressable>

        {/* Center Plus Button */}
        <View style={styles.centerNavItem}>
          <Pressable
            style={styles.centerButton}
            onPress={() => {
              router.push({
                pathname: "/add-recipe",
                params: {
                  tab: "instagram",
                  presentationStyle: "modal",
                },
              });
            }}
            android_ripple={{ color: colors.primaryDark }}
          >
            <Ionicons name="add" size={32} color={colors.white} />
          </Pressable>
        </View>

        <Pressable
          style={styles.navItem}
          onPress={() => navigate("/meal-plan")}
        >
          <Ionicons
            name={isActive("/meal-plan") ? "calendar" : "calendar-outline"}
            size={22}
            color={isActive("/meal-plan") ? colors.primary : colors.gray[500]}
          />
          <Text
            style={[
              styles.navLabel,
              isActive("/meal-plan") && styles.activeNavLabel,
            ]}
          >
            Plan
          </Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => navigate("/shopping-list")}
        >
          <Ionicons
            name={isActive("/shopping-list") ? "cart" : "cart-outline"}
            size={22}
            color={
              isActive("/shopping-list") ? colors.primary : colors.gray[500]
            }
          />
          <Text
            style={[
              styles.navLabel,
              isActive("/shopping-list") && styles.activeNavLabel,
            ]}
          >
            Shopping
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
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
  navBar: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  activeNavLabel: {
    color: colors.primary,
    fontWeight: "500",
  },
  centerNavItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -24,
    zIndex: 10,
  },
  centerButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  addButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
    backgroundColor: colors.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default Layout;
