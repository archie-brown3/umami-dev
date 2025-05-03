import React from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export type ExtractorStatus =
  | "idle"
  | "connecting"
  | "fetching"
  | "processing"
  | "parsing"
  | "complete"
  | "error";

interface ExtractorProgressProps {
  status: ExtractorStatus;
  error?: string;
  progress?: number;
}

const statusMessages = {
  idle: "Ready to extract recipe",
  connecting: "Connecting to extraction service...",
  fetching: "Fetching Instagram post data...",
  processing: "Processing media and text...",
  parsing: "Analyzing recipe content...",
  complete: "Recipe extraction complete!",
  error: "Error extracting recipe",
};

const ExtractorProgress: React.FC<ExtractorProgressProps> = ({
  status,
  error,
  progress,
}) => {
  const isActive =
    status !== "idle" && status !== "complete" && status !== "error";
  const isComplete = status === "complete";
  const isError = status === "error";

  const getStatusIcon = () => {
    if (isError) return <AlertCircle className="h-5 w-5 text-red-500" />;
    if (isComplete) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (isActive)
      return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    return null;
  };

  const getProgressPercentage = (): number => {
    if (progress !== undefined) return progress;

    // Default progress values based on status
    switch (status) {
      case "idle":
        return 0;
      case "connecting":
        return 10;
      case "fetching":
        return 30;
      case "processing":
        return 60;
      case "parsing":
        return 80;
      case "complete":
        return 100;
      case "error":
        return 100;
      default:
        return 0;
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span
            className={`text-sm font-medium ${isError ? "text-red-500" : ""}`}
          >
            {statusMessages[status]}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {getProgressPercentage()}%
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full transition-all duration-300 ${
            isError ? "bg-red-500" : isComplete ? "bg-green-500" : "bg-blue-500"
          }`}
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      {isError && error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default ExtractorProgress;
