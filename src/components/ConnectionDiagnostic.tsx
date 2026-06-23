import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { colors, spacing, typography } from "@/utils/styleUtils";
import {
  testNetworkConnectivity,
  checkSupabaseConnection,
} from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

interface ConnectionStatus {
  network: boolean | null;
  supabase: boolean | null;
  timestamp: Date;
  ping: number | null;
  details: NetInfoState | null;
}

export function ConnectionDiagnostic() {
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>({
    network: null,
    supabase: null,
    timestamp: new Date(),
    ping: null,
    details: null,
  });
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timeString = new Date().toTimeString().split(" ")[0];
    setLogs((prev) => [`[${timeString}] ${message}`, ...prev.slice(0, 19)]);
  };

  const runDiagnostics = async () => {
    setStatus((prev) => ({
      ...prev,
      network: null,
      supabase: null,
      ping: null,
    }));
    addLog("Starting connection diagnostics...");

    // Test general network connectivity
    addLog("Testing general network connectivity...");
    const startTime = Date.now();
    const isNetworkConnected = await testNetworkConnectivity();
    const networkTime = Date.now() - startTime;
    addLog(
      `Network test ${
        isNetworkConnected ? "succeeded" : "failed"
      } in ${networkTime}ms`
    );

    // Get network info details
    addLog("Getting network info details...");
    const netInfo = await NetInfo.fetch();
    addLog(`Network type: ${netInfo.type}, connected: ${netInfo.isConnected}`);

    // Test Supabase connection
    addLog("Testing Supabase connection...");
    const isSupabaseConnected = await checkSupabaseConnection();
    addLog(
      `Supabase connection ${isSupabaseConnected ? "succeeded" : "failed"}`
    );

    setStatus({
      network: isNetworkConnected,
      supabase: isSupabaseConnected,
      timestamp: new Date(),
      ping: networkTime,
      details: netInfo,
    });
  };

  useEffect(() => {
    // Run diagnostics on first render
    runDiagnostics();
  }, []);

  if (!isVisible) {
    return (
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setIsVisible(true)}
      >
        <Ionicons
          name={status.supabase === false ? "alert-circle" : "analytics"}
          size={24}
          color={status.supabase === false ? colors.red[500] : "white"}
        />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Connection Diagnostics</Text>
        <TouchableOpacity onPress={() => setIsVisible(false)}>
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Results</Text>
        <Text style={styles.label}>
          Last Run: {status.timestamp.toLocaleString()}
        </Text>
        <Text
          style={[
            styles.statusText,
            { color: status.network ? colors.green[500] : colors.red[500] },
          ]}
        >
          Internet Connectivity:{" "}
          {status.network ? `Connected (${status.ping}ms)` : "Failed"}
        </Text>
        <Text
          style={[
            styles.statusText,
            { color: status.supabase ? colors.green[500] : colors.red[500] },
          ]}
        >
          Supabase API: {status.supabase ? "Connected" : "Failed"}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.label}>Network Type: {status.details?.type}</Text>
        <Text style={styles.label}>
          Is Connected: {String(status.details?.isConnected)}
        </Text>
        <Text style={styles.label}>
          Is WiFi Enabled: {String(status.details?.isWifiEnabled)}
        </Text>
        <Text style={styles.label}>Details:</Text>
        <Text style={styles.details}>
          {JSON.stringify(status.details, null, 2)}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={runDiagnostics}>
        <Text style={styles.buttonText}>Run Diagnostics</Text>
      </TouchableOpacity>

      <View style={styles.logContainer}>
        <Text style={styles.sectionTitle}>Logs</Text>
        <ScrollView style={styles.logs}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logEntry}>
              {log}
            </Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    zIndex: 9999,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "bold",
    color: colors.dark,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "bold",
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: typography.fontSizes.md,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  statusText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "500",
    marginBottom: spacing.sm,
  },
  details: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[600],
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSizes.md,
    fontWeight: "bold",
  },
  logContainer: {
    flex: 1,
    backgroundColor: colors.dark,
    borderRadius: 12,
    padding: spacing.md,
  },
  logs: {
    flex: 1,
  },
  logEntry: {
    color: colors.gray[300],
    fontSize: typography.fontSizes.sm,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: spacing.xs,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    backgroundColor: colors.dark,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999,
  },
});
