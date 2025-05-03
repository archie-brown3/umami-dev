import React, { useState } from "react";
import { Tabs } from "expo-router";
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { Colors } from "@/constants/Colors";
import { PlusMenu } from "@/components/PlusMenu";

type ColorScheme = "light" | "dark";

export default function TabLayout() {
  const colorScheme = useColorScheme() as ColorScheme;
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme].tint,
          tabBarShowLabel: true,
          tabBarStyle: {
            height: 90,
            paddingBottom: 20,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <Ionicons name="home-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="recipes"
          options={{
            title: "Recipes",
            tabBarIcon: ({ color }) => (
              <Ionicons name="book-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="plus"
          options={{
            title: "",
            tabBarIcon: ({ color }) => (
              <Pressable
                onPress={() => setIsPlusMenuOpen(true)}
                style={{
                  backgroundColor: Colors[colorScheme].tint,
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <Ionicons name="add" size={24} color="#FFF" />
              </Pressable>
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setIsPlusMenuOpen(true);
            },
          }}
        />
        <Tabs.Screen
          name="meal-plan"
          options={{
            title: "Plan",
            tabBarIcon: ({ color }) => (
              <Ionicons name="calendar-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="shopping-list"
          options={{
            title: "Groceries",
            tabBarIcon: ({ color }) => (
              <Ionicons name="cart-outline" size={24} color={color} />
            ),
          }}
        />
      </Tabs>
      <PlusMenu
        isOpen={isPlusMenuOpen}
        onClose={() => setIsPlusMenuOpen(false)}
      />
    </>
  );
}
