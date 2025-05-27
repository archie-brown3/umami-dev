import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Tabs, Link, usePathname, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { colors, spacing, createShadow } from "@/utils/styleUtils";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/context/AuthContext";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.gray[500],
          tabBarStyle: [
            styles.tabBar,
            {
              height: Platform.OS === "ios" ? 85 + insets.bottom : 70,
              paddingBottom: Platform.OS === "ios" ? insets.bottom + 20 : 10,
            },
          ],
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarIconStyle: styles.tabBarIcon,
          tabBarItemStyle: styles.tabBarItem,
          tabBarShowLabel: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="recipes"
          options={{
            title: "Recipes",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "book" : "book-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="add-recipe"
          options={{
            title: "Add",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name="add-circle" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="meal-plan"
          options={{
            title: "Meal Plan",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "calendar" : "calendar-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="groceries"
          options={{
            title: "Groceries",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "basket" : "basket-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="debug"
          options={{
            title: "Debug",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "bug" : "bug-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  tabBar: {
    ...createShadow(5, 0.1, 10),
    paddingTop: 8,
    backgroundColor: colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: Platform.OS === "ios" ? 0 : 5,
  },
  tabBarIcon: {
    marginTop: 5,
  },
  tabBarItem: {
    paddingVertical: 5,
  },
});
