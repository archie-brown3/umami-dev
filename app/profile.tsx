import React from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { router } from "expo-router";
import Account from "../components/Account";

export default function ProfileScreen() {
  const { session } = useAuth();

  return (
    <ScrollView style={styles.container}>
      {session ? (
        <Account session={session} />
      ) : (
        <View style={styles.centered}>
          {/* If somehow a user gets here without a session, the AuthProtection in _layout.tsx
              should redirect them, but just in case, we can handle it gracefully */}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
