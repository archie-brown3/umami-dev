import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  ActivityIndicator,
} from "react-native";
import * as Network from "expo-network";
import { supabase } from "../../../lib/supabase";
import { Platform } from "react-native";
import Constants from "expo-constants";

const SupabaseDebug = () => {
  const [networkInfo, setNetworkInfo] = useState<Network.NetworkState | null>(
    null
  );
  const [pingResult, setPingResult] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<{
    [key: string]: { success: boolean; message: string };
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Get network info
  const checkNetwork = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setNetworkInfo(state);
      return state;
    } catch (error) {
      console.error("Network check error:", error);
      return null;
    }
  };

  // Test Supabase ping
  const testSupabasePing = async () => {
    setIsLoading(true);
    setPingResult("Testing...");

    try {
      const startTime = Date.now();
      // Simple ping test by fetching a small amount of data
      const { data, error } = await supabase
        .from("recipes")
        .select("id")
        .limit(1);

      const endTime = Date.now();

      if (error) {
        setPingResult(`Failed: ${error.message} (${endTime - startTime}ms)`);
        return false;
      }

      setPingResult(`Success: ${endTime - startTime}ms`);
      return true;
    } catch (error) {
      setPingResult(
        `Exception: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Run comprehensive diagnostics
  const runDiagnostics = async () => {
    setIsLoading(true);
    const results: { [key: string]: { success: boolean; message: string } } =
      {};

    // 1. Check network connectivity
    try {
      const network = await Network.getNetworkStateAsync();
      results["network"] = {
        success: !!network.isConnected,
        message: `Type: ${network.type}, Connected: ${network.isConnected}, Internet: ${network.isInternetReachable}`,
      };
    } catch (error) {
      results["network"] = {
        success: false,
        message: `Error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }

    // 2. Test DNS resolution
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      if (!supabaseUrl) throw new Error("Supabase URL not defined");

      const hostname = new URL(supabaseUrl).hostname;

      // We can't directly test DNS on React Native, so we'll do an HTTP HEAD request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`https://${hostname}`, {
        method: "HEAD",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      results["dns"] = {
        success: response.status < 500, // Any response means DNS worked
        message: `Status: ${response.status}`,
      };
    } catch (error) {
      results["dns"] = {
        success: false,
        message: `Error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }

    // 3. Test Supabase authentication endpoint
    try {
      const { error } = await supabase.auth.getSession();
      results["auth"] = {
        success: !error,
        message: error
          ? `Error: ${error.message}`
          : "Successfully connected to auth API",
      };
    } catch (error) {
      results["auth"] = {
        success: false,
        message: `Exception: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }

    // 4. Test database query
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("count()")
        .limit(1);

      results["database"] = {
        success: !error,
        message: error
          ? `Error: ${error.message}`
          : `Success: found ${data?.[0]?.count || 0} recipes`,
      };
    } catch (error) {
      results["database"] = {
        success: false,
        message: `Exception: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }

    setTestResults(results);
    setIsLoading(false);
  };

  useEffect(() => {
    checkNetwork();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Supabase Connection Diagnostics</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Information</Text>
        <Text>
          Platform: {Platform.OS} {Platform.Version}
        </Text>
        <Text>App Version: {Constants.expoConfig?.version}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network Status</Text>
        {networkInfo ? (
          <>
            <Text>Connected: {networkInfo.isConnected ? "Yes" : "No"}</Text>
            <Text>Type: {networkInfo.type}</Text>
            <Text>
              Internet Reachable:{" "}
              {networkInfo.isInternetReachable ? "Yes" : "Unknown"}
            </Text>
          </>
        ) : (
          <Text>Checking network...</Text>
        )}
        <Button title="Refresh Network Status" onPress={checkNetwork} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Supabase Ping Test</Text>
        <Text>{pingResult || "Not tested yet"}</Text>
        <Button
          title="Test Connection"
          onPress={testSupabasePing}
          disabled={isLoading}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comprehensive Tests</Text>
        {isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <Button
            title="Run All Tests"
            onPress={runDiagnostics}
            disabled={isLoading}
          />
        )}

        {Object.keys(testResults).map((key) => (
          <View key={key} style={styles.testResult}>
            <Text style={styles.testName}>
              {key.charAt(0).toUpperCase() + key.slice(1)}:{" "}
            </Text>
            <Text
              style={[
                styles.testStatus,
                { color: testResults[key].success ? "green" : "red" },
              ]}
            >
              {testResults[key].success ? "✓" : "✗"}
            </Text>
            <Text style={styles.testMessage}>{testResults[key].message}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Environment</Text>
        <Text>
          SUPABASE_URL:{" "}
          {process.env.EXPO_PUBLIC_SUPABASE_URL ? "✓ Defined" : "✗ Missing"}
        </Text>
        <Text>
          SUPABASE_ANON_KEY:{" "}
          {process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
            ? "✓ Defined"
            : "✗ Missing"}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  testResult: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
  },
  testName: {
    fontWeight: "bold",
  },
  testStatus: {
    fontWeight: "bold",
    marginRight: 4,
  },
  testMessage: {
    marginTop: 4,
  },
});

export default SupabaseDebug;
