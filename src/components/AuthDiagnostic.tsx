import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import { colors, spacing } from "@/utils/styleUtils";
import { supabase, isSupabaseConfigured, supabaseConfig } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import Constants from "expo-constants";

export default function AuthDiagnostic() {
  const [isVisible, setIsVisible] = useState(false);
  const [diagnosticData, setDiagnosticData] = useState<any>(null);
  const { session, user, isLoading } = useAuth();

  const runDiagnostics = async () => {
    try {
      const startTime = Date.now();

      const results = {
        timestamp: new Date().toISOString(),
        environment: {
          appOwnership: Constants.appOwnership,
          executionEnvironment: Constants.executionEnvironment,
          isDev: __DEV__,
          platform: Constants.platform,
        },
        supabase: {
          isConfigured: isSupabaseConfigured(),
          config: supabaseConfig,
        },
        auth: {
          hasSession: !!session,
          hasUser: !!user,
          isLoading,
          userId: user?.id?.substring(0, 8) + "..." || "none",
        },
        connectivity: {
          canReachSupabase: false,
          responseTime: 0,
          error: null,
        },
      };

      // Test Supabase connectivity
      try {
        const connectivityStart = Date.now();
        const { data, error } = await supabase.auth.getSession();
        const responseTime = Date.now() - connectivityStart;

        results.connectivity = {
          canReachSupabase: !error,
          responseTime,
          error: error?.message || null,
          hasSession: !!data.session,
        };
      } catch (connectivityError: any) {
        results.connectivity = {
          canReachSupabase: false,
          responseTime: Date.now() - startTime,
          error: connectivityError.message,
        };
      }

      setDiagnosticData(results);
      setIsVisible(true);
    } catch (error) {
      Alert.alert("Diagnostic Error", "Failed to run diagnostics");
    }
  };

  const copyToClipboard = () => {
    // For debugging purposes, show the data
    Alert.alert("Diagnostic Data", JSON.stringify(diagnosticData, null, 2), [
      { text: "OK" },
    ]);
  };

  // Only show in development or if there's an auth issue
  if (!__DEV__ && session && user) {
    return null;
  }

  return (
    <>
      <TouchableOpacity style={styles.button} onPress={runDiagnostics}>
        <Text style={styles.buttonText}>🔧 Run Auth Diagnostics</Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Authentication Diagnostics</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {diagnosticData && (
              <>
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Environment</Text>
                  <Text style={styles.sectionText}>
                    App Ownership: {diagnosticData.environment.appOwnership}
                  </Text>
                  <Text style={styles.sectionText}>
                    Execution Environment:{" "}
                    {diagnosticData.environment.executionEnvironment}
                  </Text>
                  <Text style={styles.sectionText}>
                    Development Mode:{" "}
                    {diagnosticData.environment.isDev ? "Yes" : "No"}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Supabase Configuration
                  </Text>
                  <Text
                    style={[
                      styles.sectionText,
                      {
                        color: diagnosticData.supabase.isConfigured
                          ? colors.green
                          : colors.red,
                      },
                    ]}
                  >
                    Configured:{" "}
                    {diagnosticData.supabase.isConfigured ? "✅ Yes" : "❌ No"}
                  </Text>
                  <Text style={styles.sectionText}>
                    Valid URL:{" "}
                    {diagnosticData.supabase.config.hasValidUrl
                      ? "✅ Yes"
                      : "❌ No"}
                  </Text>
                  <Text style={styles.sectionText}>
                    Valid Key:{" "}
                    {diagnosticData.supabase.config.hasValidKey
                      ? "✅ Yes"
                      : "❌ No"}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Authentication State</Text>
                  <Text style={styles.sectionText}>
                    Has Session:{" "}
                    {diagnosticData.auth.hasSession ? "✅ Yes" : "❌ No"}
                  </Text>
                  <Text style={styles.sectionText}>
                    Has User: {diagnosticData.auth.hasUser ? "✅ Yes" : "❌ No"}
                  </Text>
                  <Text style={styles.sectionText}>
                    Loading:{" "}
                    {diagnosticData.auth.isLoading ? "⏳ Yes" : "✅ No"}
                  </Text>
                  <Text style={styles.sectionText}>
                    User ID: {diagnosticData.auth.userId}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Connectivity</Text>
                  <Text
                    style={[
                      styles.sectionText,
                      {
                        color: diagnosticData.connectivity.canReachSupabase
                          ? colors.green
                          : colors.red,
                      },
                    ]}
                  >
                    Supabase Reachable:{" "}
                    {diagnosticData.connectivity.canReachSupabase
                      ? "✅ Yes"
                      : "❌ No"}
                  </Text>
                  <Text style={styles.sectionText}>
                    Response Time: {diagnosticData.connectivity.responseTime}ms
                  </Text>
                  {diagnosticData.connectivity.error && (
                    <Text style={[styles.sectionText, { color: colors.red }]}>
                      Error: {diagnosticData.connectivity.error}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={copyToClipboard}
                >
                  <Text style={styles.copyButtonText}>📋 View Full Data</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.secondary || colors.blue,
    padding: spacing.sm,
    borderRadius: 8,
    marginVertical: spacing.sm,
    alignItems: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.gray[900],
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeButtonText: {
    fontSize: 18,
    color: colors.gray[500],
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: spacing.sm,
    color: colors.gray[900],
  },
  sectionText: {
    fontSize: 14,
    color: colors.gray[700],
    marginBottom: spacing.xs,
    fontFamily: "monospace",
  },
  copyButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  copyButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
