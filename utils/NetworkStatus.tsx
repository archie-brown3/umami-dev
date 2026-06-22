import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { networkManager } from "./networkUtils";

const isIOS = Platform.OS === "ios";

export function NetworkStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = networkManager.addNetworkListener((status) => {
      setIsOffline(
        !status.isConnected || status.isInternetReachable === false
      );
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (!isOffline) {
    return null;
  }

  return (
    <View
      style={[
        styles.offlineBanner,
        isIOS && styles.offlineBannerIOS,
      ]}
    >
      <View style={styles.offlineContent}>
        <Ionicons
          name="cloud-offline-outline"
          size={14}
          color="#FFFFFF"
        />
        <Text style={styles.offlineText}>You are offline</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  offlineBannerIOS: {
    paddingTop: 3,
    paddingBottom: 3,
  },
  offlineContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  offlineText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
