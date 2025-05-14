import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import NetInfo from "@react-native-community/netinfo";

export const NetworkStatusBar = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
    });

    // Initial check
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Only show when offline
  if (isConnected) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        You are offline. Some features may be unavailable.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f44336",
    padding: 8,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
});

// Export as default for Expo Router compatibility
export default NetworkStatusBar;
