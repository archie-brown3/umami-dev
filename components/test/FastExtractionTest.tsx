/**
 * Fast Instagram Extraction Test Component
 *
 * Add this to your app to test the fast extraction functionality
 * Usage: Import and add <FastExtractionTest /> to any screen
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  FastInstagramExtractor,
  testFastInstagramExtraction,
} from "../../utils/FastInstagramExtractor";

// Define colors and spacing locally if tokens file doesn't exist
const colors = {
  primary: "#007AFF",
  background: "#F2F2F7",
  white: "#FFFFFF",
  text: "#000000",
  success: "#34C759",
  warning: "#FF9500",
  error: "#FF3B30",
  gray: {
    50: "#F9F9F9",
    100: "#F2F2F2",
    200: "#E5E5E5",
    300: "#D1D1D1",
    500: "#8E8E93",
    600: "#6D6D70",
  },
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
};

const borderRadius = {
  md: 8,
  lg: 12,
};

interface TestResult {
  success: boolean;
  extractionTime: number;
  recipe?: any;
  error?: string;
  logs: string[];
}

export const FastExtractionTest: React.FC = () => {
  const [url, setUrl] = useState("https://www.instagram.com/share/BBZ133yzEX");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Real-time timer
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading && startTime) {
      interval = setInterval(() => {
        setCurrentTime(Date.now() - startTime);
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, startTime]);

  const runTest = async () => {
    if (!url.trim()) {
      Alert.alert("Error", "Please enter an Instagram URL");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setStartTime(Date.now());
    setCurrentTime(0);

    try {
      console.log("🧪 Starting fast extraction test...");
      const testResult = await testFastInstagramExtraction(url);

      setResult(testResult);

      if (testResult.success) {
        Alert.alert(
          "🎉 Success!",
          `Recipe extracted in ${testResult.extractionTime}ms\n${
            testResult.extractionTime < 15000
              ? "✅ Target met!"
              : "❌ Exceeded 15s target"
          }`
        );
      } else {
        Alert.alert("❌ Failed", testResult.error || "Unknown error");
      }
    } catch (error) {
      console.error("Test failed:", error);
      Alert.alert(
        "❌ Test Failed",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsLoading(false);
      setStartTime(null);
    }
  };

  const runMultipleTests = async () => {
    const testUrls = [
      "https://www.instagram.com/share/BBZ133yzEX",
      "https://www.instagram.com/p/ABC123/",
      "https://www.instagram.com/reel/DEF456/",
    ];

    setIsLoading(true);
    setResult(null);

    try {
      const results = [];
      for (let i = 0; i < testUrls.length; i++) {
        console.log(`Running test ${i + 1}/${testUrls.length}`);
        const testResult = await testFastInstagramExtraction(testUrls[i]);
        results.push(testResult);

        if (i < testUrls.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      const successful = results.filter((r) => r.success).length;
      const avgTime =
        results.reduce((sum, r) => sum + r.extractionTime, 0) / results.length;

      Alert.alert(
        "📈 Multiple Tests Complete",
        `Success Rate: ${successful}/${results.length} (${(
          (successful / results.length) *
          100
        ).toFixed(1)}%)\nAverage Time: ${avgTime.toFixed(0)}ms\n${
          avgTime < 15000 ? "✅ Target met!" : "❌ Exceeded 15s target"
        }`
      );

      // Show last result
      if (results.length > 0) {
        setResult(results[results.length - 1]);
      }
    } catch (error) {
      Alert.alert(
        "❌ Tests Failed",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getTimeColor = (ms: number) => {
    if (ms < 10000) return colors.success;
    if (ms < 15000) return colors.warning;
    return colors.error;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="flash" size={24} color={colors.primary} />
        <Text style={styles.title}>Fast Instagram Extraction Test</Text>
      </View>

      <Text style={styles.subtitle}>
        Goal: Extract recipe in &lt;15 seconds
      </Text>

      {/* URL Input */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Instagram URL:</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="https://www.instagram.com/..."
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runTest}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Ionicons name="play" size={20} color="white" />
          )}
          <Text style={styles.buttonText}>
            {isLoading ? "Testing..." : "Run Test"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={runMultipleTests}
          disabled={isLoading}
        >
          <Ionicons name="repeat" size={20} color={colors.primary} />
          <Text style={[styles.buttonText, { color: colors.primary }]}>
            Multiple Tests
          </Text>
        </TouchableOpacity>
      </View>

      {/* Real-time Timer */}
      {isLoading && (
        <View style={styles.timerSection}>
          <Text style={styles.timerLabel}>Elapsed Time:</Text>
          <Text style={[styles.timer, { color: getTimeColor(currentTime) }]}>
            {formatTime(currentTime)}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((currentTime / 15000) * 100, 100)}%`,
                  backgroundColor: getTimeColor(currentTime),
                },
              ]}
            />
          </View>
          <Text style={styles.targetText}>Target: 15.0s</Text>
        </View>
      )}

      {/* Results */}
      {result && (
        <View style={styles.resultsSection}>
          <View style={styles.resultHeader}>
            <Ionicons
              name={result.success ? "checkmark-circle" : "close-circle"}
              size={24}
              color={result.success ? colors.success : colors.error}
            />
            <Text style={styles.resultTitle}>
              {result.success ? "Success!" : "Failed"}
            </Text>
          </View>

          <View style={styles.resultStats}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Time:</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: getTimeColor(result.extractionTime) },
                ]}
              >
                {formatTime(result.extractionTime)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Target:</Text>
              <Text
                style={[
                  styles.statValue,
                  {
                    color:
                      result.extractionTime < 15000
                        ? colors.success
                        : colors.error,
                  },
                ]}
              >
                {result.extractionTime < 15000 ? "✅ Met" : "❌ Missed"}
              </Text>
            </View>
          </View>

          {result.recipe && (
            <View style={styles.recipePreview}>
              <Text style={styles.recipeTitle}>{result.recipe.title}</Text>
              <Text style={styles.recipeStats}>
                {result.recipe.ingredients?.length || 0} ingredients •{" "}
                {result.recipe.instructions?.length || 0} steps
              </Text>
              <Text style={styles.recipeTags}>
                {result.recipe.tags?.join(", ") || "No tags"}
              </Text>
            </View>
          )}

          {result.error && (
            <View style={styles.errorSection}>
              <Text style={styles.errorText}>{result.error}</Text>
            </View>
          )}

          {/* Logs */}
          <TouchableOpacity
            style={styles.logsToggle}
            onPress={() => {
              Alert.alert("Extraction Logs", result.logs.join("\n"), [
                { text: "OK" },
              ]);
            }}
          >
            <Ionicons name="list" size={16} color={colors.primary} />
            <Text style={styles.logsText}>
              View Logs ({result.logs.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>How to use:</Text>
        <Text style={styles.instructionsText}>
          1. Enter an Instagram URL{"\n"}
          2. Tap "Run Test" to test single extraction{"\n"}
          3. Tap "Multiple Tests" to run batch tests{"\n"}
          4. Watch the real-time timer and results
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginLeft: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing.lg,
  },
  inputSection: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    backgroundColor: colors.white,
  },
  buttonSection: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  timerSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  timerLabel: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing.sm,
  },
  timer: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: spacing.md,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: colors.gray[200],
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  targetText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  resultsSection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginLeft: spacing.sm,
  },
  resultStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: spacing.lg,
  },
  stat: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  recipePreview: {
    backgroundColor: colors.gray[50],
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  recipeStats: {
    fontSize: 14,
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },
  recipeTags: {
    fontSize: 12,
    color: colors.primary,
  },
  errorSection: {
    backgroundColor: colors.error + "10",
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
  },
  logsToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
  },
  logsText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  instructions: {
    backgroundColor: colors.gray[50],
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.gray[600],
    lineHeight: 20,
  },
});
