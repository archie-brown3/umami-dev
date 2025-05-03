import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Button,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Auth from "../components/Auth";
import { diagnoseSuapabaseConnection } from "../utils/diagnostics";
import { testSupabaseConnection } from "../utils/testSupabase";
import * as Network from "expo-network";

export default function LoginScreen() {
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const [runningSupabaseTest, setRunningSupabaseTest] = useState(false);
  const [apiKeyInfo, setApiKeyInfo] = useState<{
    url: string | null;
    key: string | null;
    isKeyValid: boolean | null;
  }>({
    url: null,
    key: null,
    isKeyValid: null,
  });
  const [diagnosticResults, setDiagnosticResults] = useState<null | {
    networkConnected: boolean;
    networkType: string;
    tlsConnected: boolean;
    httpConnected: boolean;
    httpStatus?: number;
    error?: string;
  }>(null);

  // Check environment variables on mount
  useEffect(() => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    setApiKeyInfo({
      url: supabaseUrl || null,
      key: supabaseKey
        ? `${supabaseKey.substring(0, 10)}...${supabaseKey.substring(
            supabaseKey.length - 5
          )}`
        : null,
      isKeyValid: null,
    });
  }, []);

  const testApiKeyValidity = async () => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const apiKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !apiKey) return false;

    try {
      // Make a simple request to the Supabase API to test if the key is valid
      const response = await fetch(`${url}/rest/v1/?apikey=${apiKey}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
      });

      // Read and log the response
      const text = await response.text();
      console.log(`API key test response: ${response.status}, body: ${text}`);

      return response.status !== 401 && response.status !== 403;
    } catch (error) {
      console.error("Error testing API key:", error);
      return false;
    }
  };

  const handleRunDiagnostics = async () => {
    setRunningDiagnostics(true);
    setDiagnosticResults(null);

    try {
      // Test API key validity
      const isKeyValid = await testApiKeyValidity();
      setApiKeyInfo((prev) => ({ ...prev, isKeyValid }));

      // First check network connectivity
      const networkState = await Network.getNetworkStateAsync();
      let results: {
        networkConnected: boolean;
        networkType: string;
        tlsConnected: boolean;
        httpConnected: boolean;
        httpStatus?: number;
        error?: string;
      } = {
        networkConnected: networkState.isConnected === true,
        networkType: networkState.type || "unknown",
        tlsConnected: false,
        httpConnected: false,
      };

      // Run full diagnostics in console
      await diagnoseSuapabaseConnection();

      // Test TLS connectivity
      try {
        const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
        if (url) {
          const hostname = new URL(url).hostname;
          console.log(`Testing TLS connection to: ${hostname}`);

          // Create a promise that times out after 5 seconds
          const timeoutPromise = new Promise<Response>((_, reject) => {
            setTimeout(
              () => reject(new Error("TLS connection test timed out")),
              5000
            );
          });

          const fetchPromise = fetch(`https://${hostname}`, {
            method: "HEAD",
          });

          const response = (await Promise.race([
            fetchPromise,
            timeoutPromise,
          ])) as Response;
          results.tlsConnected = true;
        }
      } catch (e) {
        console.log("TLS connection test failed:", e);
        results.tlsConnected = false;
      }

      // Test HTTP connection to Supabase
      try {
        const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
        if (url) {
          console.log(`Testing HTTP connection to: ${url}`);

          // Create a promise that times out after 5 seconds
          const timeoutPromise = new Promise<Response>((_, reject) => {
            setTimeout(
              () => reject(new Error("HTTP connection test timed out")),
              5000
            );
          });

          const fetchPromise = fetch(
            `${url}/rest/v1/?apikey=${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
              },
            }
          );

          const response = (await Promise.race([
            fetchPromise,
            timeoutPromise,
          ])) as Response;
          results.httpConnected =
            response.status >= 200 && response.status < 300;
          results.httpStatus = response.status;
        }
      } catch (e) {
        console.log("HTTP connection test failed:", e);
        results.httpConnected = false;
        results.error = e instanceof Error ? e.message : String(e);
      }

      setDiagnosticResults(results);

      Alert.alert(
        "Diagnostics Complete",
        "Connection test results are displayed below. Check console logs for more details."
      );
    } catch (error) {
      console.error("Error running diagnostics:", error);
      setDiagnosticResults({
        networkConnected: false,
        networkType: "unknown",
        tlsConnected: false,
        httpConnected: false,
        error: error instanceof Error ? error.message : String(error),
      });

      Alert.alert(
        "Diagnostics Error",
        "There was a problem running diagnostics"
      );
    } finally {
      setRunningDiagnostics(false);
    }
  };

  const handleTestSupabase = async () => {
    setRunningSupabaseTest(true);
    try {
      Alert.alert("Testing Supabase", "Check console for detailed results");
      const result = await testSupabaseConnection();
      if (result.success) {
        Alert.alert(
          "Success",
          "Supabase connection test passed! Check console for details."
        );
      } else {
        Alert.alert(
          "Connection Failed",
          `Supabase test failed: ${
            result.error instanceof Error
              ? result.error.message
              : typeof result.error === "string"
              ? result.error
              : JSON.stringify(result.error) || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error in Supabase test:", error);
      Alert.alert(
        "Test Error",
        `An error occurred during the test: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setRunningSupabaseTest(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Auth />

      <View style={styles.diagnosticsContainer}>
        <Text style={styles.diagnosticsTitle}>Connection Troubleshooting</Text>

        <View style={styles.envInfoContainer}>
          <Text style={styles.envInfoTitle}>Environment Configuration:</Text>

          <View style={styles.envInfoRow}>
            <Text style={styles.envInfoLabel}>Supabase URL:</Text>
            <Text style={styles.envInfoValue}>
              {apiKeyInfo.url ? "✓ Set" : "✗ Missing"}
            </Text>
          </View>

          <View style={styles.envInfoRow}>
            <Text style={styles.envInfoLabel}>API Key:</Text>
            <Text style={styles.envInfoValue}>
              {apiKeyInfo.key ? `✓ ${apiKeyInfo.key}` : "✗ Missing"}
            </Text>
          </View>

          {apiKeyInfo.isKeyValid !== null && (
            <View style={styles.envInfoRow}>
              <Text style={styles.envInfoLabel}>API Key Valid:</Text>
              <Text
                style={
                  apiKeyInfo.isKeyValid
                    ? styles.resultSuccess
                    : styles.resultFailure
                }
              >
                {apiKeyInfo.isKeyValid ? "✅ Yes" : "❌ No (Invalid Key)"}
              </Text>
            </View>
          )}

          <Text style={styles.noteText}>
            Note: If keys are missing, ensure .env.local file contains
            EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
            variables.
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={
              runningDiagnostics
                ? "Running Diagnostics..."
                : "Run Connection Diagnostics"
            }
            onPress={handleRunDiagnostics}
            disabled={runningDiagnostics || runningSupabaseTest}
            color="#ff6b6b"
          />

          <Button
            title={
              runningSupabaseTest ? "Testing Supabase..." : "Test Supabase Only"
            }
            onPress={handleTestSupabase}
            disabled={runningDiagnostics || runningSupabaseTest}
            color="#4e73df"
          />
        </View>

        {runningDiagnostics && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff6b6b" />
            <Text style={styles.loadingText}>Running diagnostics...</Text>
          </View>
        )}

        {diagnosticResults && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Connection Test Results:</Text>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Network Connected:</Text>
              <Text
                style={
                  diagnosticResults.networkConnected
                    ? styles.resultSuccess
                    : styles.resultFailure
                }
              >
                {diagnosticResults.networkConnected ? "✅ Yes" : "❌ No"}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Network Type:</Text>
              <Text style={styles.resultValue}>
                {diagnosticResults.networkType}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>TLS Connection:</Text>
              <Text
                style={
                  diagnosticResults.tlsConnected
                    ? styles.resultSuccess
                    : styles.resultFailure
                }
              >
                {diagnosticResults.tlsConnected ? "✅ Success" : "❌ Failed"}
              </Text>
            </View>

            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>HTTP Connection:</Text>
              <Text
                style={
                  diagnosticResults.httpConnected
                    ? styles.resultSuccess
                    : styles.resultFailure
                }
              >
                {diagnosticResults.httpConnected ? "✅ Success" : "❌ Failed"}
              </Text>
            </View>

            {diagnosticResults.httpStatus && (
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>HTTP Status:</Text>
                <Text style={styles.resultValue}>
                  {diagnosticResults.httpStatus}
                </Text>
              </View>
            )}

            {diagnosticResults.error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorText}>{diagnosticResults.error}</Text>
              </View>
            )}

            <View style={styles.recommendations}>
              {!diagnosticResults.networkConnected && (
                <Text style={styles.recommendationText}>
                  • Check your device's internet connection
                </Text>
              )}

              {!diagnosticResults.tlsConnected &&
                diagnosticResults.networkConnected && (
                  <Text style={styles.recommendationText}>
                    • TLS connection failed - check App Transport Security
                    settings in app.json
                  </Text>
                )}

              {!diagnosticResults.httpConnected &&
                diagnosticResults.tlsConnected && (
                  <Text style={styles.recommendationText}>
                    • HTTP connection failed - check API key and Supabase URL
                  </Text>
                )}

              {diagnosticResults.httpStatus &&
                diagnosticResults.httpStatus === 401 && (
                  <Text style={styles.recommendationText}>
                    • Authentication failed - check your Supabase anon key
                  </Text>
                )}

              {diagnosticResults.httpStatus &&
                diagnosticResults.httpStatus === 403 && (
                  <Text style={styles.recommendationText}>
                    • Permission denied - check your Supabase permissions
                  </Text>
                )}
            </View>
          </View>
        )}

        <Text style={styles.diagnosticsNote}>
          This will check your Supabase connection and log detailed information
          to the console
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  diagnosticsContainer: {
    padding: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  diagnosticsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  envInfoContainer: {
    marginBottom: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
  },
  envInfoTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  envInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  envInfoLabel: {
    fontSize: 14,
    color: "#555",
  },
  envInfoValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  noteText: {
    fontSize: 12,
    color: "#777",
    marginTop: 8,
    fontStyle: "italic",
  },
  diagnosticsNote: {
    fontSize: 12,
    color: "#888",
    marginTop: 10,
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
  },
  resultsContainer: {
    marginTop: 20,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 15,
    borderLeftWidth: 3,
    borderLeftColor: "#ff6b6b",
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  resultLabel: {
    fontSize: 14,
    color: "#555",
  },
  resultValue: {
    fontSize: 14,
    fontWeight: "500",
  },
  resultSuccess: {
    color: "#2B825B",
    fontWeight: "500",
  },
  resultFailure: {
    color: "#FF3B30",
    fontWeight: "500",
  },
  errorContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#FFF5F5",
    borderRadius: 4,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FF3B30",
    marginBottom: 5,
  },
  errorText: {
    fontSize: 12,
    color: "#555",
  },
  recommendations: {
    marginTop: 15,
    padding: 10,
    backgroundColor: "#F0F8FF",
    borderRadius: 4,
  },
  recommendationText: {
    fontSize: 12,
    color: "#555",
    marginVertical: 2,
  },
  buttonContainer: {
    marginVertical: 10,
    gap: 10,
  },
});
