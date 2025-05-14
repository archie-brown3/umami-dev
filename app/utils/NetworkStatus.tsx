import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

import { useNetworkStatus } from "../hooks/useNetworkStatus";
// import { testNativeHttpConnection } from "../../utils/nativeFetch";
// import { supabase } from "../../services/supabase";

// Constants
const isIOS = Platform.OS === "ios";
const TEST_URL = Constants.expoConfig?.extra?.VITE_SUPABASE_URL || "";
const TEST_KEY = Constants.expoConfig?.extra?.VITE_SUPABASE_ANON_KEY || "";

export function NetworkStatus() {
  const {
    isConnected,
    isOffline,
    type,
    lastChecked: hookLastChecked,
  } = useNetworkStatus();
  const [supabaseStatus, setSupabaseStatus] = useState<
    "unknown" | "connected" | "disconnected"
  >("unknown");
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (hookLastChecked !== null && isConnected) {
      checkSupabaseConnection();
    } else if (isOffline) {
      setSupabaseStatus("disconnected");
    }
  }, [hookLastChecked, isConnected, isOffline]);

  const checkSupabaseConnection = async () => {
    if (isLoading || !isConnected) return;

    setIsLoading(true);
    try {
      console.log("[NetworkStatus] Testing Supabase connection...");
      if (isIOS && TEST_URL && TEST_KEY) {
        const nativeConnectionWorks = await testNativeHttpConnection(
          TEST_URL,
          TEST_KEY
        );
        setSupabaseStatus(nativeConnectionWorks ? "connected" : "disconnected");
      } else {
        const { error } = await supabase
          .from("recipes")
          .select("id", { count: "exact", head: true });
        setSupabaseStatus(error ? "disconnected" : "connected");
      }
    } catch (error) {
      console.error("[NetworkStatus] Connection test error:", error);
      setSupabaseStatus("disconnected");
    } finally {
      setIsLoading(false);
      setLastChecked(new Date());
    }
  };

  const handleRefresh = async () => {
    await checkSupabaseConnection();
    if (isConnected && supabaseStatus === "disconnected") {
      try {
        console.log("[NetworkStatus] Attempting to recover session...");
        await supabase.auth.refreshSession();
        await checkSupabaseConnection();
      } catch (error) {
        console.error("[NetworkStatus] Session refresh error:", error);
      }
    }
  };

  if (hookLastChecked === null) {
    return null;
  }

  if (isConnected && supabaseStatus === "connected") {
    return null;
  }

  let alertVariantStyle = styles.alertDefault;
  let IconComponent = (
    <Ionicons
      name="checkmark-circle-outline"
      style={[styles.icon, styles.iconDefault]}
    />
  );
  let title = "Connection restored";
  let description = "Your connection has been restored";

  if (isOffline) {
    alertVariantStyle = styles.alertDestructive;
    IconComponent = (
      <Ionicons
        name="wifi-outline"
        style={[styles.icon, styles.iconDestructive]}
      />
    );
    title = "You're offline";
    description = "Check your internet connection";
  } else if (supabaseStatus === "disconnected") {
    alertVariantStyle = styles.alertDestructive;
    IconComponent = (
      <Ionicons
        name="alert-circle-outline"
        style={[styles.icon, styles.iconDestructive]}
      />
    );
    title = "Cloud connection issue";
    description = "Cannot reach Recipe Saver servers";
  }

  return (
    <View style={[styles.alertBase, alertVariantStyle]}>
      <View style={styles.alertContent}>
        <View style={styles.alertMainSection}>
          {IconComponent}
          <View style={styles.alertTextContainer}>
            <Text
              style={[
                styles.alertTitle,
                isOffline || supabaseStatus === "disconnected"
                  ? styles.textDestructive
                  : styles.textDefault,
              ]}
            >
              {title}
            </Text>
            <Text
              style={[
                styles.alertDescription,
                isOffline || supabaseStatus === "disconnected"
                  ? styles.textDestructive
                  : styles.textDefault,
              ]}
            >
              {description}
            </Text>

            {showDetails && (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsText}>
                  Network:{" "}
                  {isConnected
                    ? `Connected (${type || "unknown"})`
                    : "Disconnected"}
                </Text>
                <Text style={styles.detailsText}>
                  Service: {supabaseStatus}
                </Text>
                {lastChecked && (
                  <Text style={styles.detailsText}>
                    Last checked: {lastChecked.toLocaleTimeString()}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.alertActions}>
          <Pressable
            style={[styles.buttonBase, styles.buttonGhost]}
            onPress={() => setShowDetails(!showDetails)}
          >
            <Text style={[styles.buttonText, styles.buttonTextGhost]}>
              {showDetails ? "Hide" : "Details"}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.buttonBase, styles.buttonOutline]}
            onPress={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#666" />
            ) : (
              <>
                <Ionicons
                  name="refresh-outline"
                  size={16}
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>Retry</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  alertBase: {
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 6,
    borderWidth: 1,
  },
  alertDefault: {
    backgroundColor: "#F0FDF4",
    borderColor: "#A7F3D0",
  },
  alertDestructive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  alertContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertMainSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  iconDefault: {
    color: "#10B981",
  },
  iconDestructive: {
    color: "#EF4444",
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "bold",
  },
  alertDescription: {
    fontSize: 13,
  },
  textDefault: {
    color: "#065F46",
  },
  textDestructive: {
    color: "#B91C1C",
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailsText: {
    fontSize: 11,
    color: "#4B5563",
  },
  alertActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  buttonBase: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  buttonGhost: {},
  buttonOutline: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  buttonText: {
    fontSize: 13,
    fontWeight: "500",
  },
  buttonTextGhost: {
    color: "#4B5563",
  },
  buttonIcon: {
    marginRight: 4,
    color: "#4B5563",
  },
});

export default NetworkStatus;
