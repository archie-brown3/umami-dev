import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  ActivityIndicator,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import {
  checkSupabaseConnection,
  testNetworkConnectivity,
} from "@/lib/supabase";
import { colors, spacing, typography } from "@/utils/styleUtils";

export const ConnectionDiagnostic = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<{
    timestamp: string;
    generalNetwork: boolean | null;
    netInfo: any;
    supabaseConnection: boolean | null;
    pingTime: number | null;
  }>({
    timestamp: new Date().toISOString(),
    generalNetwork: null,
    netInfo: null,
    supabaseConnection: null,
    pingTime: null,
  });
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${message}`,
      ...prev.slice(0, 19), // Keep last 20 logs
    ]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    addLog("Starting connection diagnostics...");

    try {
      // 1. Check general network
      addLog("Testing general network connectivity...");
      const startTime = Date.now();
      const networkConnected = await testNetworkConnectivity();
      const pingTime = Date.now() - startTime;
      addLog(
        `Network test ${
          networkConnected ? "succeeded" : "failed"
        } in ${pingTime}ms`
      );

      // 2. Get NetInfo details
      addLog("Getting network info details...");
      const netInfoState = await NetInfo.fetch();
      addLog(
        `Network type: ${netInfoState.type}, connected: ${netInfoState.isConnected}`
      );

      // 3. Test Supabase connection
      addLog("Testing Supabase connection...");
      const supabaseConnected = await checkSupabaseConnection();
      addLog(
        `Supabase connection ${supabaseConnected ? "succeeded" : "failed"}`
      );

      // Update state with results
      setDiagnosticResults({
        timestamp: new Date().toISOString(),
        generalNetwork: networkConnected,
        netInfo: netInfoState,
        supabaseConnection: supabaseConnected,
        pingTime: pingTime,
      });
    } catch (error) {
      addLog(
        `Diagnostic error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsRunning(false);
    }
  };

  // Run diagnostics on first mount
  useEffect(() => {
    runDiagnostics();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connection Diagnostics</Text>

      <View style={styles.resultsContainer}>
        <Text style={styles.sectionTitle}>Results</Text>
        <Text style={styles.resultItem}>
          Last Run: {new Date(diagnosticResults.timestamp).toLocaleString()}
        </Text>
        <Text
          style={[
            styles.resultItem,
            {
              color:
                diagnosticResults.generalNetwork === null
                  ? colors.gray[500]
                  : diagnosticResults.generalNetwork
                  ? colors.green[500]
                  : colors.red[500],
            },
          ]}
        >
          Internet Connectivity:{" "}
          {diagnosticResults.generalNetwork === null
            ? "Testing..."
            : diagnosticResults.generalNetwork
            ? "Connected"
            : "Failed"}
          {diagnosticResults.pingTime !== null &&
            ` (${diagnosticResults.pingTime}ms)`}
        </Text>

        <Text
          style={[
            styles.resultItem,
            {
              color:
                diagnosticResults.supabaseConnection === null
                  ? colors.gray[500]
                  : diagnosticResults.supabaseConnection
                  ? colors.green[500]
                  : colors.red[500],
            },
          ]}
        >
          Supabase API:{" "}
          {diagnosticResults.supabaseConnection === null
            ? "Testing..."
            : diagnosticResults.supabaseConnection
            ? "Connected"
            : "Failed"}
        </Text>

        {diagnosticResults.netInfo && (
          <View style={styles.netInfoContainer}>
            <Text style={styles.resultItem}>
              Network Type: {diagnosticResults.netInfo.type}
            </Text>
            <Text style={styles.resultItem}>
              Is Connected: {String(diagnosticResults.netInfo.isConnected)}
            </Text>
            <Text style={styles.resultItem}>
              Is WiFi Enabled: {String(diagnosticResults.netInfo.isWifiEnabled)}
            </Text>
            {diagnosticResults.netInfo.details && (
              <Text style={styles.resultItem}>
                Details:{" "}
                {JSON.stringify(diagnosticResults.netInfo.details).substring(
                  0,
                  100
                )}
                ...
              </Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.actionContainer}>
        <Button
          title={isRunning ? "Running..." : "Run Diagnostics"}
          onPress={runDiagnostics}
          disabled={isRunning}
          color={colors.primary}
        />
      </View>

      <View style={styles.logsContainer}>
        <Text style={styles.sectionTitle}>Logs</Text>
        {isRunning && <ActivityIndicator color={colors.primary} />}
        <ScrollView style={styles.logs}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logItem}>
              {log}
            </Text>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    flex: 1,
  },
  title: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "bold",
    marginBottom: spacing.md,
    color: colors.dark,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "bold",
    marginBottom: spacing.sm,
    color: colors.dark,
  },
  resultsContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  resultItem: {
    fontSize: typography.fontSizes.md,
    marginBottom: spacing.xs,
    color: colors.gray[700],
  },
  netInfoContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  actionContainer: {
    marginBottom: spacing.md,
  },
  logsContainer: {
    flex: 1,
    backgroundColor: colors.gray[900],
    borderRadius: 8,
    padding: spacing.md,
  },
  logs: {
    flex: 1,
  },
  logItem: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[200],
    fontFamily: "monospace",
    marginBottom: 2,
  },
});

export default ConnectionDiagnostic;
