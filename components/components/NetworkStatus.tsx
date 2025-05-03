import React, { useEffect, useState } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { testNativeHttpConnection } from "@/utils/supabase/nativeFetch";
import { supabase } from "@/lib/supabase";
import { Capacitor } from "@capacitor/core";

// Constants
const isIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
const TEST_URL = import.meta.env.VITE_SUPABASE_URL || "";
const TEST_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export function NetworkStatus() {
  const {
    isOnline,
    isOffline,
    connectionType,
    isInitialized,
    wasRecentlyDisconnected,
  } = useNetworkStatus();
  const [supabaseStatus, setSupabaseStatus] = useState<
    "unknown" | "connected" | "disconnected"
  >("unknown");
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Check Supabase connection initially and when network status changes
  useEffect(() => {
    if (isInitialized && isOnline) {
      checkSupabaseConnection();
    } else if (isOffline) {
      setSupabaseStatus("disconnected");
    }
  }, [isInitialized, isOnline]);

  const checkSupabaseConnection = async () => {
    if (isLoading || !isOnline) return;

    setIsLoading(true);
    try {
      console.log("[NetworkStatus] Testing Supabase connection...");

      // For iOS, use the native HTTP test
      if (isIOS && TEST_URL && TEST_KEY) {
        const nativeConnectionWorks = await testNativeHttpConnection(
          TEST_URL,
          TEST_KEY
        );
        setSupabaseStatus(nativeConnectionWorks ? "connected" : "disconnected");
      } else {
        // For web and other platforms, use a simple database query
        const { error } = await supabase.from("recipes").select("id").limit(1);
        setSupabaseStatus(error ? "disconnected" : "connected");
      }
    } catch (error) {
      console.error("[NetworkStatus] Connection test error:", error);
      setSupabaseStatus("disconnected");
    } finally {
      setIsLoading(false);
      setLastChecked(new Date());
    }
  };

  const handleRefresh = async () => {
    await checkSupabaseConnection();

    // If we're online but Supabase is disconnected, try to refresh the session
    if (isOnline && supabaseStatus === "disconnected") {
      try {
        console.log("[NetworkStatus] Attempting to recover session...");
        await supabase.auth.refreshSession();
        // Recheck connection after session refresh
        await checkSupabaseConnection();
      } catch (error) {
        console.error("[NetworkStatus] Session refresh error:", error);
      }
    }
  };

  // Don't render anything until we've initialized
  if (!isInitialized) {
    return null;
  }

  // Nothing to show if everything is working
  if (
    isOnline &&
    supabaseStatus === "connected" &&
    !wasRecentlyDisconnected(30000)
  ) {
    return null;
  }

  return (
    <Alert
      variant={
        isOffline
          ? "destructive"
          : supabaseStatus === "disconnected"
          ? "destructive"
          : "default"
      }
      className="mb-4 transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isOffline ? (
            <WifiOff className="h-5 w-5 mr-2" />
          ) : supabaseStatus === "disconnected" ? (
            <AlertCircle className="h-5 w-5 mr-2" />
          ) : (
            <CheckCircle className="h-5 w-5 mr-2" />
          )}
          <div>
            <AlertTitle>
              {isOffline
                ? "You're offline"
                : supabaseStatus === "disconnected"
                ? "Cloud connection issue"
                : "Connection restored"}
            </AlertTitle>
            <AlertDescription className="text-sm">
              {isOffline
                ? "Check your internet connection"
                : supabaseStatus === "disconnected"
                ? "Cannot reach Recipe Saver servers"
                : "Your connection has been restored"}
            </AlertDescription>

            {showDetails && (
              <div className="mt-2 text-xs opacity-70">
                <p>
                  Network:{" "}
                  {isOnline
                    ? `Connected (${connectionType || "unknown"})`
                    : "Disconnected"}
                </p>
                <p>Service: {supabaseStatus}</p>
                {lastChecked && (
                  <p>Last checked: {lastChecked.toLocaleTimeString()}</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDetails(!showDetails)}
            className="h-8 px-2"
          >
            {showDetails ? "Hide" : "Details"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-8"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </>
            )}
          </Button>
        </div>
      </div>
    </Alert>
  );
}

export default NetworkStatus;
