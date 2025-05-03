import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Capacitor } from "@capacitor/core";
import { refreshIOSSession } from "@/utils/supabase/iosAuth";
import { toast } from "@/components/ui/use-toast";

/**
 * AuthCallback component to handle redirects after authentication
 * This component handles OAuth redirects and email confirmations
 */
const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Completing authentication...");
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUserData } = useAuth();
  const isIOS =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus("Processing authentication callback...");

        // Parse URL parameters
        const url = window.location.href;
        const params = new URLSearchParams(
          location.search || url.split("#")[1]
        );

        // Enhanced logging for debugging purposes
        console.log(
          `[AuthCallback] Processing callback URL: ${url.split("?")[0]}`
        );
        console.log(`[AuthCallback] Platform: ${isIOS ? "iOS" : "Web"}`);

        // Check for error from the authentication provider
        const errorParam =
          params.get("error") || params.get("error_description");
        if (errorParam) {
          console.error(`[AuthCallback] Auth provider error: ${errorParam}`);
          setError(`Authentication failed: ${errorParam}`);
          setStatus("Error during authentication");
          toast({
            title: "Authentication Error",
            description: errorParam,
            variant: "destructive",
          });
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        // Check for access token in URL (hash fragment or query params)
        const hasAuthParams =
          url.includes("access_token") ||
          url.includes("refresh_token") ||
          url.includes("id_token") ||
          url.includes("code=");

        if (!hasAuthParams) {
          console.log("[AuthCallback] No auth parameters found in URL");
          setStatus("No authentication parameters found");
          setTimeout(() => navigate("/login"), 1500);
          return;
        }

        // Process the URL with Supabase
        console.log("[AuthCallback] Processing auth callback with Supabase...");
        setStatus("Verifying authentication...");

        // For iOS, we need more robust error handling and retry logic
        if (isIOS) {
          // First try to exchange the OAuth token/code in the URL
          try {
            // Use the appropriate method based on SDK version
            const { data, error: sessionError } =
              await supabase.auth.exchangeCodeForSession(window.location.href);

            if (sessionError) {
              console.error(
                "[AuthCallback] iOS session extraction error:",
                sessionError
              );

              // Try refreshing the session as a fallback for iOS
              console.log(
                "[AuthCallback] Attempting session refresh for iOS..."
              );
              const refreshResult = await refreshIOSSession();

              if (!refreshResult.success) {
                console.error(
                  "[AuthCallback] iOS refresh failed:",
                  refreshResult.message
                );
                setError(`Authentication failed: ${refreshResult.message}`);
                setStatus("Error during authentication");
                toast({
                  title: "Authentication Failed",
                  description: "Please try again.",
                  variant: "destructive",
                });
                setTimeout(() => navigate("/login"), 2000);
                return;
              }

              console.log("[AuthCallback] iOS session refresh successful");
            } else {
              console.log("[AuthCallback] iOS session successfully extracted");
            }
          } catch (exchangeError) {
            console.error(
              "[AuthCallback] Error exchanging code:",
              exchangeError
            );
            // Continue with session verification
          }
        } else {
          // Standard web flow - exchange the code in the URL
          try {
            const { error: callbackError } =
              await supabase.auth.exchangeCodeForSession(window.location.href);

            if (callbackError) {
              console.error(
                "[AuthCallback] Error processing auth callback:",
                callbackError
              );
              setError(`Authentication failed: ${callbackError.message}`);
              setStatus("Error during authentication");
              toast({
                title: "Authentication Error",
                description: callbackError.message,
                variant: "destructive",
              });
              setTimeout(() => navigate("/login"), 2000);
              return;
            }
          } catch (exchangeError) {
            console.error(
              "[AuthCallback] Error exchanging code:",
              exchangeError
            );
            // Continue with session verification
          }
        }

        // Verify we have a session
        const { data: sessionData } = await supabase.auth.getSession();

        if (!sessionData.session) {
          console.error(
            "[AuthCallback] No session found after auth callback processing"
          );
          setError("No session found after authentication");
          setStatus("Authentication failed");
          toast({
            title: "Authentication Failed",
            description: "Please try again.",
            variant: "destructive",
          });
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        // Success! Refresh user data and redirect
        console.log(
          "[AuthCallback] Authentication successful, session established"
        );
        setStatus("Authentication successful!");

        // Refresh user data
        await refreshUserData();

        // Redirect to the home page
        toast({
          title: "Successfully signed in",
          variant: "default",
        });
        navigate("/");
      } catch (err) {
        console.error("[AuthCallback] Unexpected error:", err);
        setError(
          `Unexpected error: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        setStatus("Error during authentication");
        toast({
          title: "Authentication Failed",
          description: "Please try again.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    handleAuthCallback();
  }, [location, navigate, refreshUserData]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {error ? "Authentication Error" : "Signing you in..."}
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {error || status}
          </p>
          {error && (
            <button
              onClick={() => navigate("/login")}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Return to Login
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
