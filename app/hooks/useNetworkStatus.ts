import { useState, useEffect } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  lastChecked: Date | null;
  isOfflineMode: boolean;
}

/**
 * Custom hook to track network connectivity status
 * @param offlineModeOverride Optional parameter to manually set offline mode
 * @returns Network status and functions to control offline mode
 */
export function useNetworkStatus(offlineModeOverride?: boolean) {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: "unknown",
    lastChecked: null,
    isOfflineMode: false,
  });

  // Manual control of offline mode
  const setOfflineMode = (value: boolean) => {
    setNetworkStatus((prev) => ({
      ...prev,
      isOfflineMode: value,
    }));
  };

  // Effect to handle manual override
  useEffect(() => {
    if (offlineModeOverride !== undefined) {
      setOfflineMode(offlineModeOverride);
    }
  }, [offlineModeOverride]);

  // Effect to subscribe to network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        lastChecked: new Date(),
        isOfflineMode: networkStatus.isOfflineMode, // Preserve offline mode setting
      });
    });

    // Initial check
    NetInfo.fetch().then((state: NetInfoState) => {
      setNetworkStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        lastChecked: new Date(),
        isOfflineMode: networkStatus.isOfflineMode, // Preserve offline mode setting
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Check network status manually
  const checkConnection = async () => {
    const state = await NetInfo.fetch();
    setNetworkStatus({
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
      lastChecked: new Date(),
      isOfflineMode: networkStatus.isOfflineMode, // Preserve offline mode setting
    });
    return state.isConnected && state.isInternetReachable;
  };

  return {
    ...networkStatus,
    isOffline: !networkStatus.isConnected || networkStatus.isOfflineMode,
    checkConnection,
    setOfflineMode,
  };
}
