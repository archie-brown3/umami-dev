import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { APIHealthCheck } from "@/components/debug/APIHealthCheck";
import { useAPIHealth } from "@/hooks/useAPIHealth";
import { API_ENDPOINTS } from "@/constants/api";
import { ConnectionDiagnostic } from "@/components/ConnectionDiagnostic";
import { colors } from "@/utils/styleUtils";

const DebugPage = () => {
  const recipeAPI = useAPIHealth({
    endpoint: API_ENDPOINTS.EXTRACT_API_URL,
  });

  const deepseekAPI = useAPIHealth({
    endpoint: API_ENDPOINTS.DEEPSEEK_API_URL,
    method: "POST",
    headers: {
      Authorization: `Bearer ${
        process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY ||
        API_ENDPOINTS.DEEPSEEK_API_KEY
      }`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: "Health check" }],
      max_tokens: 1,
    }),
    path: "",
  });

  const supabaseAPI = useAPIHealth({
    endpoint: API_ENDPOINTS.SUPABASE_API_URL,
    headers: {
      apikey: API_ENDPOINTS.SUPABASE_ANON_KEY,
    },
    path: "/rest/v1/",
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ConnectionDiagnostic />

        <APIHealthCheck
          title="Supabase API Health"
          status={supabaseAPI.status}
          logs={supabaseAPI.logs}
          onCheck={supabaseAPI.checkHealth}
          isLoading={supabaseAPI.isLoading}
        />

        <APIHealthCheck
          title="DeepSeek API Health"
          status={deepseekAPI.status}
          logs={deepseekAPI.logs}
          onCheck={deepseekAPI.checkHealth}
          isLoading={deepseekAPI.isLoading}
        />

        <APIHealthCheck
          title="Recipe Extraction Service API Health"
          status={recipeAPI.status}
          logs={recipeAPI.logs}
          onCheck={recipeAPI.checkHealth}
          isLoading={recipeAPI.isLoading}
        />
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
});

export default DebugPage;
