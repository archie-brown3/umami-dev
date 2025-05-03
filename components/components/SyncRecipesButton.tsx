import React from "react";
import { Button } from "@/components/ui/button";
import { CloudUpload, Loader2 } from "lucide-react";
import { useRecipes } from "@/context/RecipeContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export const SyncRecipesButton = () => {
  const { syncLocalRecipesToSupabase } = useRecipes();
  const { user } = useAuth() || {}; // Get user from AuthContext
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!user) {
      return; // Don't sync if not logged in
    }

    setIsSyncing(true);
    try {
      await syncLocalRecipesToSupabase();
    } finally {
      setIsSyncing(false);
    }
  };

  if (!user) {
    return null; // Don't render button if not logged in
  }

  return (
    <Button
      onClick={handleSync}
      variant="outline"
      size="sm"
      disabled={isSyncing}
    >
      {isSyncing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <CloudUpload className="mr-2 h-4 w-4" />
          Sync to Cloud
        </>
      )}
    </Button>
  );
};
