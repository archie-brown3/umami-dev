import { useState } from "react";
import { APIStatus } from "@/types/debug.types";
import { API_ENDPOINTS, API_TIMEOUT } from "@/constants/api";

interface UseAPIHealthProps {
  endpoint: string;
  headers?: Record<string, string>;
  path?: string;
  method?: "GET" | "POST";
  body?: string | null;
}

export const useAPIHealth = ({
  endpoint,
  headers = {},
  path = "/health",
  method = "GET",
  body = null,
}: UseAPIHealthProps) => {
  const [status, setStatus] = useState<APIStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const checkHealth = async () => {
    setIsLoading(true);
    addLog(`Testing ${endpoint} health...`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(`${endpoint}${path}`, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        signal: controller.signal,
        body: body,
      });

      addLog(`Response status: ${response.status} ${response.statusText}`);

      const result = await response.json();
      addLog(`Response body: ${JSON.stringify(result)}`);

      setStatus({
        status: response.ok ? "Available" : "Error",
        timestamp: new Date().toISOString(),
        ...(response.ok ? {} : { error: result.message || "Unknown error" }),
      });
    } catch (error) {
      addLog(
        `Health check failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setStatus({
        status: "Error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  };

  return {
    status,
    logs,
    isLoading,
    checkHealth,
    addLog,
    clearLogs,
  };
};
