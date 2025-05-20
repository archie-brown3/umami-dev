import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import {
  checkSupabaseConnection,
  testNetworkConnectivity,
} from "@/lib/supabase";

export const NetworkStatusBar = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);

      // Show debug info about the type of connection
      setDebugInfo(`Network type: ${state.type}, isConnected: ${connected}`);

      // Check Supabase connection when network status changes
      if (connected && !checkingConnection) {
        checkConnection();
      }
    });

    // Initial checks
    NetInfo.fetch().then((state) => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);
      if (connected) {
        checkConnection();
      }
    });

    // Periodic connection check
    const intervalId = setInterval(() => {
      if (isConnected) {
        checkConnection();
      }
    }, 30000); // Check every 30 seconds

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [isConnected]);

  const checkConnection = async () => {
    if (checkingConnection) return;

    setCheckingConnection(true);
    try {
      // First test general network connectivity
      const networkConnected = await testNetworkConnectivity();

      if (!networkConnected) {
        setIsConnected(false);
        setSupabaseConnected(false);
        setDebugInfo("General network connectivity test failed");
      } else {
        setIsConnected(true);

        // Then test Supabase connection specifically
        const isSupabaseConnected = await checkSupabaseConnection();
        setSupabaseConnected(isSupabaseConnected);

        if (!isSupabaseConnected) {
          setDebugInfo(
            "Supabase connection failed but general network is available"
          );
        } else {
          setDebugInfo(null);
        }
      }
    } catch (error) {
      console.error("Error checking connections:", error);
      setSupabaseConnected(false);
      setDebugInfo(
        `Connection error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setCheckingConnection(false);
    }
  };

  // Only show when either offline or Supabase is disconnected
  if (isConnected && supabaseConnected) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {!isConnected
          ? "You are offline. Some features may be unavailable."
          : "Unable to connect to the server. Please try again later."}
      </Text>
      {__DEV__ && debugInfo && (
        <Text style={styles.debugText}>{debugInfo}</Text>
      )}
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
  debugText: {
    color: "white",
    fontSize: 10,
    opacity: 0.8,
    marginTop: 2,
  },
});

// Export as default for Expo Router compatibility
export default NetworkStatusBar;
