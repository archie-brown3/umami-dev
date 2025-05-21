import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { Stack } from "expo-router";
import { colors, spacing } from "../../utils/styleUtils";
import ShoppingListScreen from "../../components/groceries/ShoppingListScreen";
import CupboardScreen from "../../components/groceries/CupboardScreen";

const Tab = createMaterialTopTabNavigator();

export default function GroceriesTab() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Groceries",
          headerShadowVisible: false,
        }}
      />
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary[600],
          tabBarInactiveTintColor: colors.gray[500],
          tabBarIndicatorStyle: { backgroundColor: colors.primary[600] },
          tabBarLabelStyle: {
            fontWeight: "500",
            fontSize: 14,
          },
          tabBarStyle: {
            elevation: 0,
            shadowOpacity: 0,
            backgroundColor: colors.white,
          },
        }}
      >
        <Tab.Screen
          name="ShoppingList"
          component={ShoppingListScreen}
          options={{ tabBarLabel: "Shopping List" }}
        />
        <Tab.Screen
          name="Cupboard"
          component={CupboardScreen}
          options={{ tabBarLabel: "Cupboard" }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
