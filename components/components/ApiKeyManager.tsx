import React, { useState, useEffect } from "react";
import { hasApiKeys, saveApiKeys } from "@/services/nutrition/apiConfig";
import { initialize as initializeNutritionService } from "@/services/nutrition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

const ApiKeyManager: React.FC = () => {
  const [usdaApiKey, setUsdaApiKey] = useState("");
  const [spoonacularApiKey, setSpoonacularApiKey] = useState("");
  const [apiStatus, setApiStatus] = useState<{
    usda: boolean;
    spoonacular: boolean;
  }>({ usda: false, spoonacular: false });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if API keys are already stored
    const keys = hasApiKeys();
    setApiStatus(keys);

    // Load keys from localStorage
    if (typeof window !== "undefined") {
      setUsdaApiKey(localStorage.getItem("USDA_API_KEY") || "");
      setSpoonacularApiKey(localStorage.getItem("SPOONACULAR_API_KEY") || "");
    }
  }, []);

  const handleSaveKeys = async () => {
    setIsLoading(true);
    try {
      // Save keys
      saveApiKeys({
        usdaApiKey: usdaApiKey.trim(),
        spoonacularApiKey: spoonacularApiKey.trim(),
      });

      // Re-initialize services
      const status = await initializeNutritionService();
      setApiStatus({
        usda: status.usdaAvailable,
        spoonacular: status.spoonacularAvailable,
      });

      toast.success("API keys saved and services initialized");
    } catch (error) {
      console.error("Error saving API keys:", error);
      toast.error("Failed to save API keys");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Nutrition API Keys</CardTitle>
        <CardDescription>
          Configure your API keys for nutrition services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="usdaApiKey">
            USDA FoodData Central API Key
            {apiStatus.usda ? (
              <span className="ml-2 text-xs text-green-500">Connected ✓</span>
            ) : (
              <span className="ml-2 text-xs text-gray-500">Not connected</span>
            )}
          </Label>
          <Input
            id="usdaApiKey"
            value={usdaApiKey}
            onChange={(e) => setUsdaApiKey(e.target.value)}
            placeholder="Enter your USDA API key"
          />
          <p className="text-xs text-gray-500">
            Get a key at{" "}
            <a
              href="https://fdc.nal.usda.gov/api-key-signup.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              fdc.nal.usda.gov
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="spoonacularApiKey">
            Spoonacular API Key
            {apiStatus.spoonacular ? (
              <span className="ml-2 text-xs text-green-500">Connected ✓</span>
            ) : (
              <span className="ml-2 text-xs text-gray-500">Not connected</span>
            )}
          </Label>
          <Input
            id="spoonacularApiKey"
            value={spoonacularApiKey}
            onChange={(e) => setSpoonacularApiKey(e.target.value)}
            placeholder="Enter your Spoonacular API key"
          />
          <p className="text-xs text-gray-500">
            Get a key at{" "}
            <a
              href="https://spoonacular.com/food-api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              spoonacular.com/food-api
            </a>
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          onClick={handleSaveKeys}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Save API Keys"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeyManager;
