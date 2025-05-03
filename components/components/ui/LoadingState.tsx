import React, { useState, useEffect } from "react";
import { Loader2, WifiOff, AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { useNavigate } from "react-router-dom";

interface LoadingStateProps {
  message?: string;
  timeout?: number;
  isError?: boolean;
  errorMessage?: string;
  isOffline?: boolean;
  onRetry?: () => void;
}

/**
 * A reusable loading state component with timeout and error handling
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  timeout = 15000, // 15 seconds default timeout
  isError = false,
  errorMessage = "Something went wrong. Please try again.",
  isOffline = false,
  onRetry,
}) => {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const navigate = useNavigate();

  // Set a timeout for the loading state
  useEffect(() => {
    if (!isError && !isOffline) {
      const timer = setTimeout(() => {
        setHasTimedOut(true);
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [isError, isOffline, timeout]);

  // If there's an error, show error state
  if (isError) {
    return (
      <div className="error-container">
        <AlertTriangle className="error-icon h-10 w-10" />
        <h3 className="text-lg font-semibold text-red-700 mb-2">Error</h3>
        <p className="error-message">{errorMessage}</p>
        {onRetry && (
          <Button
            variant="outline"
            onClick={onRetry}
            className="error-action mt-4"
          >
            Try Again
          </Button>
        )}
      </div>
    );
  }

  // If offline, show offline state
  if (isOffline) {
    return (
      <div className="error-container bg-amber-50 border-amber-200">
        <WifiOff className="h-10 w-10 text-amber-500 mb-2" />
        <h3 className="text-lg font-semibold text-amber-700 mb-2">
          You're Offline
        </h3>
        <p className="text-amber-700">
          Please check your internet connection and try again.
        </p>
        {onRetry && (
          <Button
            variant="outline"
            onClick={onRetry}
            className="mt-4 px-4 py-2 bg-white text-amber-600 border border-amber-300 rounded-md hover:bg-amber-50 transition-colors font-medium text-sm"
          >
            Retry Connection
          </Button>
        )}
      </div>
    );
  }

  // If loading timed out, show timeout UI
  if (hasTimedOut) {
    return (
      <div className="error-container bg-gray-50 border-gray-200">
        <AlertTriangle className="h-10 w-10 text-gray-500 mb-2" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Taking longer than expected
        </h3>
        <p className="text-gray-600">
          This is taking longer than usual. You can wait a bit longer or try
          refreshing.
        </p>
        <div className="flex gap-3 mt-4">
          {onRetry && (
            <Button
              variant="outline"
              onClick={onRetry}
              className="px-4 py-2 bg-white text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Retry
            </Button>
          )}
          <Button
            variant="default"
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-recipe-green text-white border-none rounded-md hover:bg-recipe-dark transition-colors font-medium text-sm"
          >
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  // Default loading state
  return (
    <div className="loading-container">
      <Loader2 className="h-8 w-8 text-recipe-green animate-spin mb-2" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
};
