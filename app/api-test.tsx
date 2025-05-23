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
import { colors, spacing, typography } from "@/utils/styleUtils";
import { Stack } from "expo-router";
import {
  supabase,
  testNetworkConnectivity,
  checkSupabaseConnection,
} from "@/lib/supabase";
import { API_ENDPOINTS } from "@/constants/api";
import { SafeAreaView } from "react-native-safe-area-context";

interface ApiTestResult {
  name: string;
  success: boolean | null;
  response?: any;
  error?: string;
  duration: number;
}

export default function ApiTestScreen() {
  const [results, setResults] = useState<ApiTestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const runTests = async () => {
    setIsTesting(true);
    setResults([]);

    // Network connectivity test
    await testNetworkApi();

    // Supabase test
    await testSupabaseApi();

    // DeepSeek API test
    await testDeepSeekApi();

    // Recipe extraction API test
    await testExtractionApi();

    setIsTesting(false);
  };

  // Run tests on mount
  useEffect(() => {
    runTests();
  }, []);

  const testNetworkApi = async () => {
    const startTime = Date.now();
    try {
      const networkConnected = await testNetworkConnectivity();
      setResults((prev) => [
        ...prev,
        {
          name: "Network Connectivity",
          success: networkConnected,
          duration: Date.now() - startTime,
        },
      ]);
    } catch (error) {
      setResults((prev) => [
        ...prev,
        {
          name: "Network Connectivity",
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
        },
      ]);
    }
  };

  const testSupabaseApi = async () => {
    const startTime = Date.now();
    try {
      const supabaseConnected = await checkSupabaseConnection();
      setResults((prev) => [
        ...prev,
        {
          name: "Supabase API",
          success: supabaseConnected,
          duration: Date.now() - startTime,
        },
      ]);
    } catch (error) {
      setResults((prev) => [
        ...prev,
        {
          name: "Supabase API",
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
        },
      ]);
    }
  };

  const testDeepSeekApi = async () => {
    const startTime = Date.now();
    try {
      // Simple ping to DeepSeek API
      const response = await fetch(API_ENDPOINTS.DEEPSEEK_API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${API_ENDPOINTS.DEEPSEEK_API_KEY}`,
        },
      });

      const success = response.status < 400;
      setResults((prev) => [
        ...prev,
        {
          name: "DeepSeek API",
          success,
          response: {
            status: response.status,
            statusText: response.statusText,
          },
          duration: Date.now() - startTime,
        },
      ]);
    } catch (error) {
      setResults((prev) => [
        ...prev,
        {
          name: "DeepSeek API",
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
        },
      ]);
    }
  };

  const testExtractionApi = async () => {
    const startTime = Date.now();
    try {
      const response = await fetch(`${API_ENDPOINTS.EXTRACT_API_URL}/health`, {
        method: "GET",
      });

      const success = response.status < 400;
      const responseData = await response.json().catch(() => null);

      setResults((prev) => [
        ...prev,
        {
          name: "Recipe Extraction API",
          success,
          response: {
            status: response.status,
            data: responseData,
          },
          duration: Date.now() - startTime,
        },
      ]);
    } catch (error) {
      setResults((prev) => [
        ...prev,
        {
          name: "Recipe Extraction API",
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration: Date.now() - startTime,
        },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: "API Connection Test" }} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>API Connection Tests</Text>

        {results.map((result, index) => (
          <View key={index} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.apiName}>{result.name}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      result.success === null
                        ? colors.gray[400]
                        : result.success
                        ? colors.green[500]
                        : colors.red[500],
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  {result.success === null
                    ? "PENDING"
                    : result.success
                    ? "SUCCESS"
                    : "FAILED"}
                </Text>
              </View>
            </View>

            <Text style={styles.duration}>Duration: {result.duration}ms</Text>

            {result.error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorLabel}>Error:</Text>
                <Text style={styles.errorText}>{result.error}</Text>
              </View>
            )}

            {result.response && (
              <View style={styles.responseContainer}>
                <Text style={styles.responseLabel}>Response:</Text>
                <Text style={styles.responseText}>
                  {JSON.stringify(result.response, null, 2)}
                </Text>
              </View>
            )}
          </View>
        ))}

        {isTesting && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Testing APIs...</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={runTests}
          disabled={isTesting}
        >
          <Text style={styles.buttonText}>
            {isTesting ? "Testing..." : "Run Tests"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  content: {
    padding: spacing.md,
  },
  heading: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "bold",
    marginBottom: spacing.lg,
    color: colors.dark,
  },
  resultCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  apiName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "600",
    color: colors.dark,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 4,
  },
  statusText: {
    color: colors.white,
    fontSize: typography.fontSizes.xs,
    fontWeight: "bold",
  },
  duration: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.sm,
  },
  errorContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: "#FFEEEE",
    borderRadius: 4,
  },
  errorLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600",
    color: colors.red[500],
    marginBottom: 2,
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.red[500],
  },
  responseContainer: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
  },
  responseLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600",
    color: colors.gray[700],
    marginBottom: 2,
  },
  responseText: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[800],
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: "center",
    marginVertical: spacing.md,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSizes.md,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    padding: spacing.md,
  },
  loadingText: {
    marginTop: spacing.sm,
    color: colors.gray[700],
    fontSize: typography.fontSizes.md,
  },
});
