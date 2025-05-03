import React, { useEffect, useState } from "react";
import { useNetwork } from "@/context/NetworkContext";
import { cn } from "@/lib/utils";
import { AlertCircle, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface NetworkStatusBarProps {
  className?: string;
}

export function NetworkStatusBar({ className }: NetworkStatusBarProps) {
  const { isOnline, isOffline, connectionType, wasRecentlyDisconnected } =
    useNetwork();

  const [visible, setVisible] = useState(false);
  const [wasOnline, setWasOnline] = useState(isOnline);

  useEffect(() => {
    // Show immediately when offline
    if (isOffline) {
      setVisible(true);
    }

    // When coming back online after being offline
    if (isOnline && !wasOnline) {
      // Show "Back Online" message briefly then hide
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }

    setWasOnline(isOnline);
  }, [isOnline, isOffline, wasOnline]);

  const handleRefresh = () => {
    window.location.reload();
  };

  // Don't render anything if always been online and still online
  if (!visible) return null;

  return (
    <Alert
      variant={isOnline ? "default" : "destructive"}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 mb-0 rounded-none flex items-center justify-between",
        className
      )}
    >
      <div className="flex items-center">
        {isOnline ? (
          <Wifi className="h-4 w-4 mr-2" />
        ) : (
          <WifiOff className="h-4 w-4 mr-2" />
        )}
        <div>
          <AlertTitle>{isOnline ? "Back Online" : "You're Offline"}</AlertTitle>
          <AlertDescription>
            {isOnline
              ? "Your connection has been restored."
              : "Please check your internet connection."}
          </AlertDescription>
        </div>
      </div>
      <Button
        variant={isOnline ? "outline" : "secondary"}
        size="sm"
        className="ml-2"
        onClick={handleRefresh}
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        {isOnline ? "Dismiss" : "Refresh"}
      </Button>
    </Alert>
  );
}
