import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { colors, spacing, fontSizes, borderRadius } from "../utils/styleUtils";
import { getServiceLogs, clearServiceLogs } from "../services/deepseekservice";
import NetInfo from "@react-native-community/netinfo";
import * as Clipboard from "expo-clipboard";

const EXTRACT_API_URL = "https://recipeextractionservice.onrender.com";
const DEEPSEEK_API_KEY =
  process.env.DEEPSEEK_API_KEY || "sk-b168886219d34d939d0b7c6f760b4123";
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const SUPABASE_API_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

// Custom color definitions for error and success states
const statusColors = {
  success: "#4CAF50",
  error: "#F44336",
};

const DebugPage = () => {
  const [apiStatus, setApiStatus] = useState<{
    status: string;
    timestamp: string;
    error?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiTestResponse, setApiTestResponse] = useState<any>(null);
  const [deepSeekStatus, setDeepSeekStatus] = useState<{
    status: string;
    timestamp: string;
    error?: string;
  } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [serviceLogs, setServiceLogs] = useState<string[]>([]);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<{
    status: string;
    timestamp: string;
    error?: string;
  } | null>(null);

  const checkApiHealth = async () => {
    setIsLoading(true);
    addLog("Testing API health...");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    try {
      const response = await fetch(`${EXTRACT_API_URL}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const result = await response.json();
      setApiStatus({
        status: response.ok ? "Available" : "Error",
        timestamp: new Date().toISOString(),
        ...(response.ok ? {} : { error: result.message || "Unknown error" }),
      });
    } catch (error) {
      clearTimeout(timeout);
      console.error("API health check failed:", error);
      setApiStatus({
        status: "Error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testExtractApi = async () => {
    setIsLoading(true);
    addLog("Testing extraction API with sample URL...");
    addLog(`Platform: ${Platform.OS}`);
    addLog(`API URL: ${EXTRACT_API_URL}/api/extract`);
    addLog(`Request Method: POST`);
    addLog(`Request Headers: { 'Content-Type': 'application/json' }`);
    const testUrl = "https://www.instagram.com/p/CxWrz2cub5v/";
    addLog(`Request Body: ${JSON.stringify({ url: testUrl })}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    try {
      // Log network state before fetch
      const netState = await NetInfo.fetch();
      addLog(
        `Network State before fetch: isConnected=${netState.isConnected}, isInternetReachable=${netState.isInternetReachable}, type=${netState.type}`
      );
      addLog("About to send fetch request...");
      const response = await fetch(`${EXTRACT_API_URL}/api/extract`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: testUrl }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      addLog(
        `Fetch completed. Status: ${response.status} ${response.statusText}`
      );
      addLog(
        `Response Headers: ${JSON.stringify(
          Object.fromEntries(response.headers.entries())
        )}`
      );
      // Get the raw response text first
      const rawText = await response.text();
      addLog(`Raw API Response: ${rawText.substring(0, 300)}`);
      // Try to parse as JSON
      let jsonData;
      try {
        jsonData = JSON.parse(rawText);
        setApiTestResponse(jsonData);
        addLog("Successfully parsed JSON response");
      } catch (parseError) {
        addLog(
          `Failed to parse JSON: ${
            parseError instanceof Error ? parseError.message : "Unknown error"
          }`
        );
        addLog(
          `ParseError stack: ${
            parseError instanceof Error ? parseError.stack : "No stack"
          }`
        );
        setApiTestResponse({
          error: "JSON parse error",
          rawResponse: rawText.substring(0, 300) + "...",
        });
      }
    } catch (error) {
      clearTimeout(timeout);
      addLog(`Network request failed. Error type: ${(error as any)?.name}`);
      addLog(
        `Error message: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      addLog(
        `Error stack: ${error instanceof Error ? error.stack : "No stack"}`
      );
      addLog(`Is this a TypeError? ${error instanceof TypeError}`);
      NetInfo.fetch().then((state) => {
        addLog(
          `Network State after error: isConnected=${state.isConnected}, isInternetReachable=${state.isInternetReachable}, type=${state.type}`
        );
      });
      setApiTestResponse({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkDeepSeekApi = async () => {
    setIsLoading(true);
    addLog("Testing DeepSeek API...");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    try {
      // Simple test query to DeepSeek API
      const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "user",
              content: 'Say "API is working" if you can receive this message.',
            },
          ],
          temperature: 0.2,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        addLog(`DeepSeek API error: ${response.status} - ${errorText}`);
        setDeepSeekStatus({
          status: "Error",
          timestamp: new Date().toISOString(),
          error: `HTTP ${response.status}: ${errorText}`,
        });
        return;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      addLog(`DeepSeek response: ${content}`);

      setDeepSeekStatus({
        status: "Available",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      clearTimeout(timeout);
      console.error("DeepSeek API check failed:", error);
      addLog(
        `DeepSeek API error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setDeepSeekStatus({
        status: "Error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkSupabaseApi = async () => {
    setIsLoading(true);
    addLog("--- Testing Supabase API health ---");
    addLog(`Platform: ${Platform.OS}`);
    addLog(`SUPABASE_API_URL (from env): ${SUPABASE_API_URL}`);
    const supabaseHealthCheckUrl = `${SUPABASE_API_URL}/rest/v1/`;
    addLog(`Attempting to reach: ${supabaseHealthCheckUrl}`);

    try {
      const netState = await NetInfo.fetch();
      addLog(
        `Network State immediately before Supabase fetch: isConnected=${netState.isConnected}, isInternetReachable=${netState.isInternetReachable}, type=${netState.type}`
      );
    } catch (e) {
      addLog(
        `Failed to get network state before Supabase health check: ${
          e instanceof Error ? e.message : String(e)
        }`
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      addLog(
        "Supabase health check: Request timed out after 10 seconds, aborting."
      );
      controller.abort();
    }, 10000); // 10s timeout

    const headers = {
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
      // "Authorization": `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ""}` // Standard for Supabase is apikey in header
    };
    addLog(`Request Headers: ${JSON.stringify(headers)}`);

    try {
      addLog(`Sending GET request to: ${supabaseHealthCheckUrl}`);
      const response = await fetch(supabaseHealthCheckUrl, {
        method: "GET",
        headers: headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      addLog(
        `Supabase health response status: ${response.status} ${response.statusText}`
      );
      addLog(
        `Supabase health response headers: ${JSON.stringify(
          Object.fromEntries(response.headers.entries())
        )}`
      );
      const resultText = await response.text();
      addLog(
        `Supabase health response body (first 300 chars): ${resultText.substring(
          0,
          300
        )}`
      );
      setSupabaseStatus({
        status: response.ok ? "Available" : "Error",
        timestamp: new Date().toISOString(),
        ...(response.ok
          ? {}
          : {
              error: `${response.status} ${
                response.statusText
              } - ${resultText.substring(0, 100)}`,
            }),
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        addLog(
          "Supabase API health check failed: Request was aborted (likely due to timeout)."
        );
        setSupabaseStatus({
          status: "Error",
          timestamp: new Date().toISOString(),
          error: "Request Aborted (Timeout)",
        });
      } else {
        addLog(
          `Supabase API health check failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        if (error instanceof Error && error.stack) {
          addLog(`Supabase API health check error stack: ${error.stack}`);
        }
        setSupabaseStatus({
          status: "Error",
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : "Unknown fetch error",
        });
      }
      try {
        const netState = await NetInfo.fetch();
        addLog(
          `Network State after Supabase health check error: isConnected=${netState.isConnected}, isInternetReachable=${netState.isInternetReachable}, type=${netState.type}`
        );
      } catch (e) {
        addLog(
          `Failed to get network state after Supabase health check error: ${
            e instanceof Error ? e.message : String(e)
          }`
        );
      }
    } finally {
      setIsLoading(false);
      addLog("--- Finished Supabase API health test ---");
    }
  };

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const refreshServiceLogs = () => {
    setServiceLogs(getServiceLogs());
  };

  const handleCopyLogs = async () => {
    await Clipboard.setStringAsync(logs.join("\n"));
    setCopyStatus("Copied!");
    setTimeout(() => setCopyStatus(null), 1500);
  };

  useEffect(() => {
    // Check API health when component mounts
    checkApiHealth();

    // Get initial service logs
    refreshServiceLogs();

    // Set up interval to refresh logs every 5 seconds
    const logsInterval = setInterval(refreshServiceLogs, 5000);

    // Log platform and environment info at component mount
    addLog(`Platform: ${Platform.OS}`);
    addLog(`EXTRACT_API_URL: ${EXTRACT_API_URL}`);
    addLog(`DEEPSEEK_API_URL: ${DEEPSEEK_API_URL}`);
    addLog(
      `DEEPSEEK_API_KEY: ${
        DEEPSEEK_API_KEY ? "***" + DEEPSEEK_API_KEY.substr(-4) : "Not set"
      }`
    );
    NetInfo.fetch().then((state) => {
      addLog(
        `Initial Network State: isConnected=${state.isConnected}, isInternetReachable=${state.isInternetReachable}, type=${state.type}`
      );
    });

    return () => {
      clearInterval(logsInterval);
    };
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>API Debug Information</Text>

      <View style={styles.section}>
        <Text style={styles.warningText}>
          ⚠️ VPN Required: API connections in iOS simulators require an active
          VPN. No VPN is needed on actual devices.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recipe Extraction API Status</Text>
        <Text style={styles.apiUrl}>{EXTRACT_API_URL}</Text>

        {apiStatus ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>
              Status:{" "}
              <Text
                style={{
                  color:
                    apiStatus.status === "Available"
                      ? statusColors.success
                      : statusColors.error,
                }}
              >
                {apiStatus.status}
              </Text>
            </Text>
            <Text style={styles.statusText}>
              Checked: {new Date(apiStatus.timestamp).toLocaleTimeString()}
            </Text>
            {apiStatus.error && (
              <Text style={styles.errorText}>Error: {apiStatus.error}</Text>
            )}
          </View>
        ) : (
          <Text style={styles.loadingText}>Checking API status...</Text>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.button}
            onPress={checkApiHealth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Check Health</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.secondary }]}
            onPress={testExtractApi}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Test Extraction</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DeepSeek API Status</Text>
        <Text style={styles.apiUrl}>{DEEPSEEK_API_URL}</Text>

        {deepSeekStatus ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>
              Status:{" "}
              <Text
                style={{
                  color:
                    deepSeekStatus.status === "Available"
                      ? statusColors.success
                      : statusColors.error,
                }}
              >
                {deepSeekStatus.status}
              </Text>
            </Text>
            <Text style={styles.statusText}>
              Checked: {new Date(deepSeekStatus.timestamp).toLocaleTimeString()}
            </Text>
            {deepSeekStatus.error && (
              <Text style={styles.errorText}>
                Error: {deepSeekStatus.error}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.loadingText}>
            DeepSeek API status not checked
          </Text>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={checkDeepSeekApi}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Check DeepSeek</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Supabase API Status</Text>
        <Text style={styles.apiUrl}>{SUPABASE_API_URL}/rest/v1/</Text>
        {supabaseStatus ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusText}>
              Status:{" "}
              <Text
                style={{
                  color:
                    supabaseStatus.status === "Available"
                      ? statusColors.success
                      : statusColors.error,
                }}
              >
                {supabaseStatus.status}
              </Text>
            </Text>
            <Text style={styles.statusText}>
              Checked: {new Date(supabaseStatus.timestamp).toLocaleTimeString()}
            </Text>
            {supabaseStatus.error && (
              <Text style={styles.errorText}>
                Error: {supabaseStatus.error}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.loadingText}>
            Supabase API status not checked
          </Text>
        )}
        <TouchableOpacity
          style={styles.button}
          onPress={checkSupabaseApi}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Check Supabase</Text>
          )}
        </TouchableOpacity>
      </View>

      {apiTestResponse && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Test Result</Text>
          <ScrollView style={styles.responseContainer}>
            <Text style={styles.responseText}>
              {apiTestResponse.error
                ? `Error: ${apiTestResponse.error}\n\nRaw Response: ${apiTestResponse.rawResponse}`
                : JSON.stringify(apiTestResponse, null, 2)}
            </Text>
          </ScrollView>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.logHeader}>
          <Text style={styles.sectionTitle}>Debug Logs</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={handleCopyLogs}
              style={{ marginRight: 12 }}
            >
              <Text style={styles.copyText}>Copy</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearLogs}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
        {copyStatus && <Text style={styles.copiedText}>{copyStatus}</Text>}
        <ScrollView style={styles.logContainer}>
          {logs.length === 0 ? (
            <Text style={styles.emptyLogText}>No logs yet.</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={styles.logText}>
                {log}
              </Text>
            ))
          )}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.logHeader}>
          <Text style={styles.sectionTitle}>Service Logs</Text>
          <TouchableOpacity
            onPress={() => {
              clearServiceLogs();
              setServiceLogs([]);
            }}
          >
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.logContainer}>
          {serviceLogs.length === 0 ? (
            <Text style={styles.emptyLogText}>No service logs available.</Text>
          ) : (
            serviceLogs.map((log, index) => (
              <Text key={index} style={styles.logText}>
                {log}
              </Text>
            ))
          )}
        </ScrollView>

        <TouchableOpacity
          style={[styles.button, { marginTop: spacing.md }]}
          onPress={refreshServiceLogs}
        >
          <Text style={styles.buttonText}>Refresh Service Logs</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Environment Information</Text>
        <View style={styles.envCard}>
          <Text style={styles.envText}>API URL: {EXTRACT_API_URL}</Text>
          <Text style={styles.envText}>
            DeepSeek API URL: {DEEPSEEK_API_URL}
          </Text>
          <Text style={styles.envText}>
            DeepSeek API Key:{" "}
            {DEEPSEEK_API_KEY ? "***" + DEEPSEEK_API_KEY.substr(-4) : "Not set"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
    padding: spacing.md,
  },
  header: {
    fontSize: fontSizes.xl,
    fontWeight: "700",
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.gray[900],
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: "600",
    color: colors.gray[800],
    marginBottom: spacing.sm,
  },
  apiUrl: {
    fontSize: fontSizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.sm,
  },
  statusCard: {
    backgroundColor: colors.gray[100],
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  statusText: {
    fontSize: fontSizes.md,
    color: colors.gray[800],
    marginBottom: spacing.xs,
  },
  errorText: {
    fontSize: fontSizes.sm,
    color: statusColors.error,
    marginTop: spacing.xs,
  },
  loadingText: {
    fontSize: fontSizes.md,
    color: colors.gray[600],
    fontStyle: "italic",
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "600",
  },
  responseContainer: {
    backgroundColor: colors.gray[100],
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    maxHeight: 200,
  },
  responseText: {
    fontSize: fontSizes.sm,
    color: colors.gray[800],
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  clearText: {
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  copyText: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    marginRight: 8,
  },
  copiedText: {
    fontSize: fontSizes.xs,
    color: colors.primary,
    marginBottom: 4,
    textAlign: "right",
  },
  logContainer: {
    backgroundColor: colors.gray[900],
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    maxHeight: 200,
  },
  emptyLogText: {
    fontSize: fontSizes.sm,
    color: colors.gray[500],
    fontStyle: "italic",
  },
  logText: {
    fontSize: fontSizes.xs,
    color: colors.gray[200],
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: spacing.xs,
  },
  envCard: {
    backgroundColor: colors.gray[100],
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  envText: {
    fontSize: fontSizes.sm,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
  warningText: {
    fontSize: fontSizes.md,
    color: "#FF6B35",
    fontWeight: "600",
    marginBottom: spacing.sm,
    textAlign: "center",
    padding: spacing.sm,
  },
});

export default DebugPage;
