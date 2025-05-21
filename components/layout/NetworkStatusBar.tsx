import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import {
  checkSupabaseConnection,
  testNetworkConnectivity,
} from "@/lib/supabase";

const LONG_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const NETINFO_DEBOUNCE_TIME = 3000; // 3 seconds

export const NetworkStatusBar = () => {
  const [isNetInfoConnected, setIsNetInfoConnected] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [checkingSupabase, setCheckingSupabase] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const netInfoDebounceTimer = useRef<number | null>(null);

  const performFullCheck = useCallback(
    async (source: string) => {
      if (checkingSupabase) {
        console.log(
          `[NetworkStatusBar] Check skipped (already in progress), triggered by: ${source}`
        );
        return;
      }
      console.log(
        `[NetworkStatusBar] Performing full connection check, triggered by: ${source}`
      );
      setCheckingSupabase(true);
      setDebugInfo("Checking connections...");

      try {
        const generalNetworkOk = await testNetworkConnectivity();
        if (!generalNetworkOk) {
          setSupabaseConnected(false);
          setDebugInfo("General internet connectivity test failed.");
          // No early return here, finally will setCheckingSupabase(false)
        } else {
          const isSupabaseOk = await checkSupabaseConnection();
          setSupabaseConnected(isSupabaseOk);
          if (!isSupabaseOk) {
            setDebugInfo("Supabase connection failed (internet seems OK).");
          } else {
            setDebugInfo("Connections healthy.");
          }
        }
      } catch (error) {
        console.error("[NetworkStatusBar] Error during full check:", error);
        setSupabaseConnected(false);
        setDebugInfo(
          `Connection check error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        setCheckingSupabase(false);
      }
    },
    [checkingSupabase]
  );

  // Effect for NetInfo (local network status)
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const currentlyConnected = state.isConnected ?? false;
      setIsNetInfoConnected(currentlyConnected);
      setDebugInfo(
        `NetInfo: type=${state.type}, connected=${currentlyConnected} (from listener)`
      );

      if (netInfoDebounceTimer.current) {
        clearTimeout(netInfoDebounceTimer.current);
      }

      if (currentlyConnected) {
        netInfoDebounceTimer.current = setTimeout(() => {
          performFullCheck("NetInfo listener - connected");
        }, NETINFO_DEBOUNCE_TIME);
      } else {
        setSupabaseConnected(false); // If NetInfo says disconnected, Supabase is also out
      }
    });

    // Initial check with NetInfo
    NetInfo.fetch().then((state) => {
      const initiallyConnected = state.isConnected ?? false;
      setIsNetInfoConnected(initiallyConnected);
      setDebugInfo(
        `NetInfo: type=${state.type}, connected=${initiallyConnected} (initial fetch)`
      );
      if (initiallyConnected) {
        performFullCheck("Initial NetInfo fetch - connected");
      } else {
        setSupabaseConnected(false);
      }
    });

    return () => {
      unsubscribe();
      if (netInfoDebounceTimer.current) {
        clearTimeout(netInfoDebounceTimer.current);
      }
    };
  }, [performFullCheck]);

  // Effect for periodic checks
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isNetInfoConnected) {
        performFullCheck("Periodic interval");
      }
    }, LONG_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [isNetInfoConnected, performFullCheck]);

  const effectivelyOffline = !isNetInfoConnected || !supabaseConnected;

  if (!effectivelyOffline && !__DEV__) {
    return null;
  }
  if (!effectivelyOffline && __DEV__ && debugInfo === "Connections healthy.") {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: effectivelyOffline ? "#f44336" : "#4caf50" },
      ]}
    >
      <Text style={styles.text}>
        {!isNetInfoConnected
          ? "Offline (No network connection)"
          : !supabaseConnected
          ? "Online, but server connection issue"
          : "Connected"}
      </Text>
      {__DEV__ && debugInfo && (
        <Text style={styles.debugText}>{debugInfo}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // backgroundColor is now dynamic
    padding: 8,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 0, // Example: position at the bottom
    zIndex: 1000, // Ensure it's on top
  },
  text: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  debugText: {
    color: "white",
    fontSize: 10,
    opacity: 0.8,
    marginTop: 2,
    textAlign: "center",
  },
});

export default NetworkStatusBar;
