import React, { useState, useEffect } from "react";
import { simplifiedRecipeService } from "../services/supabase/simplifiedRecipeService";
import { dbConnectionCheck } from "../services/supabase/dbConnectionCheck";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { CheckCircle, AlertCircle, Info, RefreshCw } from "lucide-react";

/**
 * Database debugging component to troubleshoot Supabase connectivity issues
 */
export const DatabaseDebugger: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<
    "checking" | "success" | "error" | null
  >(null);
  const [schemaStatus, setSchemaStatus] = useState<
    "checking" | "success" | "warning" | "error" | null
  >(null);
  const [createStatus, setCreateStatus] = useState<
    "idle" | "creating" | "success" | "error"
  >("idle");
  const [fetchStatus, setFetchStatus] = useState<
    "idle" | "fetching" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [recipeCount, setRecipeCount] = useState<number | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  // Add to debug log
  const log = (message: string) => {
    setDebugLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${message}`,
    ]);
  };

  // Check database connection
  const checkConnection = async () => {
    setConnectionStatus("checking");
    setError(null);
    log("Checking database connection...");

    try {
      const result = await dbConnectionCheck.checkConnection();
      if (result.success) {
        setConnectionStatus("success");
        setRecipeCount(result.count as number);
        log(`Connection successful! Found ${result.count} recipes.`);
      } else {
        setConnectionStatus("error");
        setError(result.error || "Unknown connection error");
        log(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      setConnectionStatus("error");
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setError(errorMessage);
      log(`Connection check error: ${errorMessage}`);
    }
  };

  // Check database schema
  const checkSchema = async () => {
    setSchemaStatus("checking");
    log("Checking database schema...");

    try {
      const result = await dbConnectionCheck.validateSchema();
      if (result.success) {
        setSchemaStatus("success");
        log("Schema validation passed!");
      } else if (
        result.results &&
        Object.values(result.results).some(Boolean)
      ) {
        setSchemaStatus("warning");
        log("Schema validation incomplete. Some tables may be missing.");
      } else {
        setSchemaStatus("error");
        log("Schema validation failed. Database tables not found.");
      }
    } catch (error) {
      setSchemaStatus("error");
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      log(`Schema check error: ${errorMessage}`);
    }
  };

  // Create a test recipe
  const createTestRecipe = async () => {
    setCreateStatus("creating");
    log("Creating test recipe...");

    try {
      const result = await simplifiedRecipeService.createRecipe({
        title: `Test Recipe ${new Date().toLocaleTimeString()}`,
        description: "This is a test recipe created by the database debugger",
        imageUrl: "",
        ingredients: [],
        steps: ["This is a test step"],
        prepTime: 5,
        cookTime: 10,
        servings: 1,
        category: "Test",
        tags: ["test"],
        source: "Debug Tool",
        saved: true,
      });

      if (result) {
        setCreateStatus("success");
        log(`Test recipe created successfully with ID: ${result.id}`);
      } else {
        setCreateStatus("error");
        log("Failed to create test recipe. Check console for details.");
      }
    } catch (error) {
      setCreateStatus("error");
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      log(`Create recipe error: ${errorMessage}`);
    }
  };

  // Fetch recipes
  const fetchRecipes = async () => {
    setFetchStatus("fetching");
    log("Fetching recipes...");

    try {
      const recipes = await simplifiedRecipeService.getRecipes();
      setRecipeCount(recipes.length);
      setFetchStatus("success");
      log(`Successfully fetched ${recipes.length} recipes`);
    } catch (error) {
      setFetchStatus("error");
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      log(`Fetch recipes error: ${errorMessage}`);
    }
  };

  // Run connection check on mount
  useEffect(() => {
    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="w-full max-w-3xl mx-auto mb-8">
      <CardHeader>
        <CardTitle>Database Connection Debugger</CardTitle>
        <CardDescription>
          Use this tool to diagnose issues with your Supabase database
          connection
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Connection Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Connection Status</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={checkConnection}
              disabled={connectionStatus === "checking"}
            >
              {connectionStatus === "checking" ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Check Connection
            </Button>
          </div>

          {connectionStatus === "success" && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Connected</AlertTitle>
              <AlertDescription className="text-green-700">
                Successfully connected to Supabase. Found {recipeCount} recipes.
              </AlertDescription>
            </Alert>
          )}

          {connectionStatus === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Connection Error</AlertTitle>
              <AlertDescription>
                {error ||
                  "Failed to connect to the database. Check your credentials and network connection."}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Schema Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Schema Status</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={checkSchema}
              disabled={schemaStatus === "checking"}
            >
              {schemaStatus === "checking" ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Check Schema
            </Button>
          </div>

          {schemaStatus === "success" && (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Schema Valid</AlertTitle>
              <AlertDescription className="text-green-700">
                All required database tables and columns exist.
              </AlertDescription>
            </Alert>
          )}

          {schemaStatus === "warning" && (
            <Alert className="bg-amber-50 border-amber-200">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">
                Schema Incomplete
              </AlertTitle>
              <AlertDescription className="text-amber-700">
                Some database tables or columns may be missing. Features may be
                limited.
              </AlertDescription>
            </Alert>
          )}

          {schemaStatus === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Schema Error</AlertTitle>
              <AlertDescription>
                Database schema check failed. Required tables may be missing.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Recipe Operations */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Test Database Operations</h3>

          <div className="flex gap-4">
            <Button
              onClick={createTestRecipe}
              disabled={
                createStatus === "creating" || connectionStatus !== "success"
              }
            >
              {createStatus === "creating" ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create Test Recipe
            </Button>

            <Button
              variant="outline"
              onClick={fetchRecipes}
              disabled={
                fetchStatus === "fetching" || connectionStatus !== "success"
              }
            >
              {fetchStatus === "fetching" ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Fetch Recipes
            </Button>
          </div>
        </div>

        {/* Debug Log */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Debug Log</h3>
          <div className="bg-gray-100 p-3 rounded text-sm font-mono h-60 overflow-y-auto">
            {debugLog.length === 0 ? (
              <span className="text-gray-500">No log entries yet.</span>
            ) : (
              debugLog.map((entry, i) => (
                <div
                  key={i}
                  className="py-1 border-b border-gray-200 last:border-b-0"
                >
                  {entry}
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
