import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/utils/styleUtils";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.gray[500],
          tabBarStyle: [
            styles.tabBar,
            {
              height: Platform.OS === "ios" ? 60 + insets.bottom : 60,
              paddingBottom: Platform.OS === "ios" ? insets.bottom : 8,
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
      </Tabs>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  tabBar: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 8,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 6,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginBottom: Platform.OS === "ios" ? 0 : 2,
  },
  tabBarIcon: {
    marginTop: 2,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
});
