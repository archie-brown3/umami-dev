import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { migrateLocalStorageToSupabase } from "@/utils/migrateToSupabase";
import { toast } from "sonner";
import { ArrowUpFromLine, Check, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DataMigration() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  const handleMigration = async () => {
    try {
      setIsMigrating(true);
      const success = await migrateLocalStorageToSupabase();

      if (success) {
        setMigrationComplete(true);
      }
    } catch (error) {
      console.error("Migration failed:", error);
      toast.error("Data migration failed. Please try again later.");
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUpFromLine className="h-5 w-5" />
          Data Migration
        </CardTitle>
        <CardDescription>
          Move your recipe data to the cloud for secure storage and access from
          anywhere.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {migrationComplete ? (
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle>Migration Complete!</AlertTitle>
            <AlertDescription>
              Your data has been successfully transferred to the cloud. You can
              now access your recipes from any device.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              This will migrate all your recipes, lists, meal plans, and other
              data from your current device to your cloud account. This needs to
              be done only once.
            </p>
            <div className="text-sm bg-amber-50 p-3 rounded-md border border-amber-100 text-amber-800">
              Note: This process may take a few minutes depending on how many
              recipes you have. Please keep this window open during the
              migration.
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleMigration}
          disabled={isMigrating || migrationComplete}
          className="w-full"
          variant={migrationComplete ? "outline" : "default"}
        >
          {isMigrating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrating Data...
            </>
          ) : migrationComplete ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Migration Complete
            </>
          ) : (
            "Migrate My Data to the Cloud"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
