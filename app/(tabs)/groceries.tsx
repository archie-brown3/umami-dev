import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { colors } from "../../utils/styleUtils";
import ShoppingListScreen from "../../components/groceries/ShoppingListScreen";

export default function GroceriesTab() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: "Groceries",
          headerShadowVisible: false,
        }}
      />
      <ShoppingListScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
