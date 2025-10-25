import React from "react";
import { FallbackProps } from "react-error-boundary";

/**
 * Error fallback component for React Error Boundary
 */
const ErrorFallback: React.FC<FallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-slate-900 p-4">
      <div className="bg-red-100 dark:bg-red-900/20 p-6 rounded-lg max-w-lg w-full shadow-lg">
        <h2 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
          {error.message || "An unexpected error occurred"}
        </p>
        <div className="bg-gray-100 dark:bg-slate-800 p-2 rounded text-xs font-mono text-gray-700 dark:text-gray-300 mb-4 overflow-auto max-h-32">
          {error.stack}
        </div>
        <button
          onClick={resetErrorBoundary}
          className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
};

export default ErrorFallback;
