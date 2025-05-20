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
import {
  colors,
  spacing,
  typography,
  borderRadius,
} from "../../utils/styleUtils";
import {
  getServiceLogs,
  clearServiceLogs,
} from "../../services/deepseekservice";
import NetInfo from "@react-native-community/netinfo";
import * as Clipboard from "expo-clipboard";
import { SafeAreaView } from "react-native-safe-area-context";

import ConnectionDiagnostic from "@/components/ConnectionDiagnostic";

const EXTRACT_API_URL = "https://recipeextractionservice.onrender.com";
const DEEPSEEK_API_KEY =
  process.env.DEEPSEEK_API_KEY || "sk-b168886219d34d939d0b7c6f760b4123";
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const SUPABASE_API_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const RECIPE_API_URL = "https://recipeextractionservice.onrender.com";

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
  const [recipeApiStatus, setRecipeApiStatus] = useState<{
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

  const checkRecipeApiHealth = async () => {
    setIsLoading(true);
    addLog("Testing Recipe Extraction Service API health...");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    try {
      const response = await fetch(`${RECIPE_API_URL}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const result = await response.json();
      setRecipeApiStatus({
        status: response.ok ? "Available" : "Error",
        timestamp: new Date().toISOString(),
        ...(response.ok ? {} : { error: result.message || "Unknown error" }),
      });
      addLog(
        `Recipe Extraction Service API health: ${
          response.ok ? "Available" : "Error"
        }`
      );
    } catch (error) {
      clearTimeout(timeout);
      console.error(
        "Recipe Extraction Service API health check failed:",
        error
      );
      setRecipeApiStatus({
        status: "Error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
      addLog(
        `Recipe Extraction Service API health check failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
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

    checkRecipeApiHealth();

    return () => {
      clearInterval(logsInterval);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ConnectionDiagnostic />
        {/* Recipe Extraction Service API Health Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Recipe Extraction Service API Health
          </Text>
          <View style={styles.statusContainer}>
            <Text
              style={
                recipeApiStatus?.status === "Available"
                  ? styles.successText
                  : styles.errorText
              }
            >
              {recipeApiStatus
                ? `${recipeApiStatus.status} (${recipeApiStatus.timestamp})`
                : "Unknown"}
            </Text>
          </View>
          {recipeApiStatus?.error && (
            <Text style={styles.errorText}>{recipeApiStatus.error}</Text>
          )}
          <TouchableOpacity
            style={styles.button}
            onPress={checkRecipeApiHealth}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Test Recipe API Health</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700",
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    paddingBottom: spacing.sm,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  statusText: {
    fontSize: typography.fontSizes.md,
    color: colors.dark,
    marginLeft: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: statusColors.error,
    marginTop: spacing.xs,
  },
  successText: {
    fontSize: typography.fontSizes.sm,
    color: statusColors.success,
    marginTop: spacing.xs,
  },
  timestampText: {
    fontSize: typography.fontSizes.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  clearButton: {
    backgroundColor: colors.red[500],
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSizes.md,
    fontWeight: "600",
  },
  logsContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.sm,
    maxHeight: 300,
  },
  logEntry: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[700],
    marginBottom: spacing.xs,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  responseContainer: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.md,
  },
  responseText: {
    fontSize: typography.fontSizes.sm,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: colors.dark,
  },
  copyButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.gray[300],
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  copyButtonText: {
    fontSize: typography.fontSizes.xs,
    color: colors.dark,
  },
  copyStatusText: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm + 50, // Adjust to not overlap with copy button
    backgroundColor: colors.green[500],
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    color: colors.white,
    fontSize: typography.fontSizes.xs,
  },
  warningText: {
    fontSize: typography.fontSizes.md,
    color: "#FF6B35",
    fontWeight: "600",
    marginBottom: spacing.sm,
    textAlign: "center",
    padding: spacing.sm,
  },
  apiUrl: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.sm,
  },
  statusCard: {
    backgroundColor: colors.gray[100],
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSizes.md,
    color: colors.gray[600],
    fontStyle: "italic",
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  copyText: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary,
    marginRight: 8,
  },
  clearText: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary,
  },
  copiedText: {
    fontSize: typography.fontSizes.xs,
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
    fontSize: typography.fontSizes.sm,
    color: colors.gray[500],
    fontStyle: "italic",
  },
  logText: {
    fontSize: typography.fontSizes.xs,
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
    fontSize: typography.fontSizes.sm,
    color: colors.gray[700],
    marginBottom: spacing.xs,
  },
});

export default DebugPage;
