import React, { useState, useEffect } from "react";
import { supabase, diagnoseSupabaseConnection } from "@/lib/supabase";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { testNativeHttpConnection } from "@/utils/supabase/nativeFetch";
import { refreshIOSSession } from "@/utils/supabase/iosAuth";
import { Network } from "@capacitor/network";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { Badge } from "@/components/ui/badge";

// Platform detection
const isIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
const isNative = Capacitor.isNativePlatform();

// Get environment variables
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export function SupabaseConnectionDebug() {
  const { isOnline, connectionType } = useNetworkStatus();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, any>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [authStatus, setAuthStatus] = useState<string>("unknown");
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  useEffect(() => {
    // Check auth status on mount
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setAuthStatus("error");
        console.error("Auth status error:", error);
      } else if (data?.session) {
        setAuthStatus("authenticated");
        setSessionInfo({
          user: data.session.user.email,
          expiresAt: new Date(data.session.expires_at! * 1000).toLocaleString(),
          provider: data.session.user.app_metadata?.provider || "unknown",
        });
      } else {
        setAuthStatus("unauthenticated");
      }
    } catch (e) {
      setAuthStatus("error");
      console.error("Auth check exception:", e);
    }
  };

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const diagnosticResults: Record<string, any> = {
        timestamp: new Date().toISOString(),
        platform: isIOS ? "iOS" : isNative ? Capacitor.getPlatform() : "web",
        isOnline,
        networkType: connectionType,
      };

      // 1. Test general Supabase connectivity
      try {
        const diagMessage = await diagnoseSupabaseConnection();
        diagnosticResults.diagnoseResult = diagMessage;
      } catch (error) {
        diagnosticResults.diagnoseError = String(error);
      }

      // 2. Check if we're authenticated
      try {
        const { data, error } = await supabase.auth.getSession();
        diagnosticResults.hasSession = !!data?.session;
        diagnosticResults.sessionError = error ? String(error) : null;

        if (data?.session) {
          diagnosticResults.sessionExpiresAt = new Date(
            data.session.expires_at! * 1000
          ).toLocaleString();
        }
      } catch (error) {
        diagnosticResults.sessionCheckError = String(error);
      }

      // 3. For iOS, run the native HTTP test
      if (isIOS) {
        try {
          diagnosticResults.nativeHttpTest = await testNativeHttpConnection(
            supabaseUrl,
            supabaseAnonKey
          );
        } catch (error) {
          diagnosticResults.nativeHttpError = String(error);
        }
      }

      // 4. Try a simple database query
      try {
        const { data, error } = await supabase
          .from("recipes")
          .select("count")
          .single();
        diagnosticResults.databaseQuerySuccess = !error;
        diagnosticResults.databaseQueryError = error ? String(error) : null;
        diagnosticResults.databaseQueryResult = data;
      } catch (error) {
        diagnosticResults.databaseQueryException = String(error);
      }

      setResults(diagnosticResults);
    } catch (error) {
      setResults({
        error: String(error),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    setLoading(true);
    try {
      if (isIOS) {
        const success = await refreshIOSSession();
        setResults({
          ...results,
          sessionRefreshResult: success ? "success" : "failed",
          timestamp: new Date().toISOString(),
        });
      } else {
        const { data, error } = await supabase.auth.refreshSession();
        setResults({
          ...results,
          sessionRefreshResult: error ? "failed" : "success",
          sessionRefreshError: error ? String(error) : null,
          timestamp: new Date().toISOString(),
        });
      }

      // Refresh auth status display
      await checkAuthStatus();
    } catch (error) {
      setResults({
        ...results,
        sessionRefreshException: String(error),
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const renderAuthStatus = () => {
    switch (authStatus) {
      case "authenticated":
        return (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              Authenticated
            </Badge>
            {sessionInfo && (
              <span className="text-xs text-gray-500">
                {sessionInfo.user} (Expires: {sessionInfo.expiresAt})
              </span>
            )}
          </div>
        );
      case "unauthenticated":
        return <Badge variant="secondary">Not authenticated</Badge>;
      case "error":
        return <Badge variant="destructive">Authentication error</Badge>;
      default:
        return <Badge variant="outline">Checking...</Badge>;
    }
  };

  const renderNetworkStatus = () => {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">Network:</span>
          {isOnline ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              Online
            </Badge>
          ) : (
            <Badge variant="destructive">Offline</Badge>
          )}
        </div>
        {connectionType && (
          <div className="text-sm text-gray-500">
            Connection type: {connectionType}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Supabase Connection Diagnostics</CardTitle>
        <CardDescription>
          Troubleshoot Supabase connection issues on{" "}
          {isIOS ? "iOS" : "this device"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {renderAuthStatus()}
        {renderNetworkStatus()}

        {Object.keys(results).length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Diagnostic Results</h3>

            <div className="rounded border p-2 bg-gray-50 mb-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="font-medium">Platform:</div>
                <div>{results.platform}</div>

                <div className="font-medium">Timestamp:</div>
                <div>{new Date(results.timestamp).toLocaleString()}</div>

                <div className="font-medium">Connection Test:</div>
                <div>
                  {results.diagnoseResult ? (
                    <Badge
                      variant={
                        results.diagnoseResult.includes("passed")
                          ? "default"
                          : "destructive"
                      }
                      className={
                        results.diagnoseResult.includes("passed")
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : ""
                      }
                    >
                      {results.diagnoseResult}
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Failed</Badge>
                  )}
                </div>

                {isIOS && (
                  <>
                    <div className="font-medium">iOS Native HTTP:</div>
                    <div>
                      {results.nativeHttpTest !== undefined ? (
                        <Badge
                          variant={
                            results.nativeHttpTest ? "default" : "destructive"
                          }
                          className={
                            results.nativeHttpTest
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : ""
                          }
                        >
                          {results.nativeHttpTest ? "Working" : "Failed"}
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Test Error</Badge>
                      )}
                    </div>
                  </>
                )}

                <div className="font-medium">Database Query:</div>
                <div>
                  {results.databaseQuerySuccess !== undefined ? (
                    <Badge
                      variant={
                        results.databaseQuerySuccess ? "default" : "destructive"
                      }
                      className={
                        results.databaseQuerySuccess
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : ""
                      }
                    >
                      {results.databaseQuerySuccess ? "Success" : "Failed"}
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Error</Badge>
                  )}
                </div>

                <div className="font-medium">Session Check:</div>
                <div>
                  {results.hasSession !== undefined ? (
                    <Badge
                      variant={results.hasSession ? "default" : "secondary"}
                      className={
                        results.hasSession
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : ""
                      }
                    >
                      {results.hasSession ? "Active Session" : "No Session"}
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Check Failed</Badge>
                  )}
                </div>

                {results.sessionRefreshResult && (
                  <>
                    <div className="font-medium">Session Refresh:</div>
                    <div>
                      <Badge
                        variant={
                          results.sessionRefreshResult === "success"
                            ? "default"
                            : "destructive"
                        }
                        className={
                          results.sessionRefreshResult === "success"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : ""
                        }
                      >
                        {results.sessionRefreshResult}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            </div>

            {showAdvanced && (
              <div className="mt-4 rounded border p-2 bg-gray-50 overflow-auto max-h-40">
                <pre className="text-xs">
                  {JSON.stringify(results, null, 2)}
                </pre>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="mt-2"
            >
              {showAdvanced ? "Hide Details" : "Show Advanced Details"}
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button onClick={runDiagnostics} disabled={loading}>
          {loading ? "Running..." : "Run Diagnostics"}
        </Button>

        <Button
          variant="outline"
          onClick={refreshSession}
          disabled={loading || authStatus !== "authenticated"}
        >
          Refresh Session
        </Button>
      </CardFooter>
    </Card>
  );
}

export default SupabaseConnectionDebug;
