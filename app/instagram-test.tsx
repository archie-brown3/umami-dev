import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import {
  testInstagramScraping,
  testMultipleInstagramUrls,
} from "../services/recipeExtractor";
import { getServiceLogs, clearServiceLogs } from "../services/deepseekservice";

export default function InstagramTestScreen() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Sample Instagram URLs for testing
  const sampleUrls = [
    "https://www.instagram.com/p/SAMPLE1/",
    "https://www.instagram.com/p/SAMPLE2/",
    "https://www.instagram.com/p/SAMPLE3/",
  ];

  const handleSingleTest = async () => {
    if (!url.trim()) {
      Alert.alert("Error", "Please enter an Instagram URL");
      return;
    }

    setLoading(true);
    setTestResult(null);
    clearServiceLogs();

    try {
      const result = await testInstagramScraping(url.trim());
      setTestResult(result);
      setLogs(getServiceLogs());
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleTests = async () => {
    setLoading(true);
    setTestResult(null);
    clearServiceLogs();

    try {
      const result = await testMultipleInstagramUrls(sampleUrls);
      setTestResult(result);
      setLogs(getServiceLogs());
    } catch (error) {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResult(null);
    setLogs([]);
    clearServiceLogs();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Instagram Scraping Test</Text>
      <Text style={styles.subtitle}>
        Test the new /scrape-web endpoint for Instagram posts
      </Text>

      <View style={styles.inputSection}>
        <Text style={styles.label}>Instagram URL:</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="https://www.instagram.com/p/..."
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSingleTest}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Testing..." : "Test Single URL"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.secondaryButton,
            loading && styles.buttonDisabled,
          ]}
          onPress={handleMultipleTests}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Test Multiple URLs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      {testResult && (
        <View style={styles.resultSection}>
          <Text style={styles.resultTitle}>Test Results:</Text>

          {testResult.success ? (
            <View style={styles.successResult}>
              <Text style={styles.successText}>✅ {testResult.message}</Text>

              {testResult.extractedData && (
                <View style={styles.extractedData}>
                  <Text style={styles.dataTitle}>Extracted Data:</Text>
                  <Text style={styles.dataItem}>
                    <Text style={styles.dataLabel}>Username:</Text>{" "}
                    {testResult.extractedData.username}
                  </Text>
                  <Text style={styles.dataItem}>
                    <Text style={styles.dataLabel}>Caption Length:</Text>{" "}
                    {testResult.extractedData.caption.length} chars
                  </Text>
                  <Text style={styles.dataItem}>
                    <Text style={styles.dataLabel}>Has Thumbnail:</Text>{" "}
                    {testResult.extractedData.thumbnail ? "Yes" : "No"}
                  </Text>

                  <Text style={styles.dataTitle}>Caption Preview:</Text>
                  <Text style={styles.captionPreview}>
                    {testResult.extractedData.caption.substring(0, 200)}
                    {testResult.extractedData.caption.length > 200 ? "..." : ""}
                  </Text>

                  {testResult.extractedData.thumbnail && (
                    <Text style={styles.dataItem}>
                      <Text style={styles.dataLabel}>Thumbnail:</Text>{" "}
                      {testResult.extractedData.thumbnail}
                    </Text>
                  )}
                </View>
              )}

              {testResult.results && (
                <View style={styles.multipleResults}>
                  <Text style={styles.dataTitle}>Multiple URL Results:</Text>
                  {testResult.results.map((result: any, index: number) => (
                    <View key={index} style={styles.multipleResultItem}>
                      <Text style={styles.urlText}>{result.url}</Text>
                      <Text
                        style={
                          result.success ? styles.successText : styles.errorText
                        }
                      >
                        {result.success ? "✅ Success" : "❌ Failed"}
                      </Text>
                      {result.success && (
                        <>
                          <Text style={styles.dataItem}>
                            Username: {result.username}
                          </Text>
                          <Text style={styles.dataItem}>
                            Caption: {result.caption?.substring(0, 100)}...
                          </Text>
                        </>
                      )}
                      {result.error && (
                        <Text style={styles.errorText}>
                          Error: {result.error}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.errorResult}>
              <Text style={styles.errorText}>❌ {testResult.message}</Text>
            </View>
          )}
        </View>
      )}

      {logs.length > 0 && (
        <View style={styles.logsSection}>
          <Text style={styles.logsTitle}>Service Logs:</Text>
          <ScrollView style={styles.logsContainer}>
            {logs.map((log, index) => (
              <Text key={index} style={styles.logItem}>
                {index + 1}. {log}
              </Text>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  buttonSection: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#34C759",
  },
  clearButton: {
    backgroundColor: "#FF9500",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultSection: {
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  successResult: {
    backgroundColor: "#d4edda",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c3e6cb",
  },
  errorResult: {
    backgroundColor: "#f8d7da",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f5c6cb",
  },
  successText: {
    color: "#155724",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  errorText: {
    color: "#721c24",
    fontSize: 16,
    fontWeight: "bold",
  },
  extractedData: {
    marginTop: 10,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 5,
    color: "#333",
  },
  dataItem: {
    fontSize: 14,
    marginBottom: 5,
    color: "#333",
  },
  dataLabel: {
    fontWeight: "bold",
  },
  captionPreview: {
    fontSize: 14,
    color: "#555",
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  multipleResults: {
    marginTop: 15,
  },
  multipleResultItem: {
    backgroundColor: "#f8f9fa",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  urlText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  logsSection: {
    marginTop: 20,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  logsContainer: {
    maxHeight: 300,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  logItem: {
    fontSize: 12,
    color: "#333",
    marginBottom: 5,
    fontFamily: "monospace",
  },
});
