import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { Tabs, Link, usePathname, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing, createShadow } from "../utils/styleUtils";
import useColorScheme from "../hooks/useColorScheme";
import { NetworkStatusBar } from "../components/layout/NetworkStatusBar";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <NetworkStatusBar />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.gray[500],
          tabBarStyle: styles.tabBar,
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
          name="shopping"
          options={{
            title: "Shopping",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "cart" : "cart-outline"}
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
    height: 75,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    paddingTop: 6,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 5,
  },
  tabBarIcon: {
    marginTop: 5,
  },
  tabBarItem: {
    paddingVertical: 5,
  },
});
