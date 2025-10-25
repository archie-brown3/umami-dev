import React, { useState, useEffect } from "react";
import { getUserCountry, getStores } from "../../services/openPricesService";
import { OpenPricesStore } from "../../services/openPricesService";

// Default settings
const DEFAULT_SETTINGS = {
  useOpenPricesApi: true,
  country: "US",
  preferredStoreId: "",
  cacheEnabled: true,
  cacheDuration: 24, // hours
};

interface PriceSettingsProps {
  onSettingsChange?: (settings: any) => void;
}

const PriceSettings: React.FC<PriceSettingsProps> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState(() => {
    // Load settings from localStorage if available
    const savedSettings = localStorage.getItem("priceSettings");
    return savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [stores, setStores] = useState<OpenPricesStore[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load user's country and available stores
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Get user's country
        const country = await getUserCountry();

        // Update settings with detected country
        updateSettings("country", country);

        // Load stores for this country
        const storeList = await getStores(country);
        setStores(storeList);
      } catch (err) {
        console.error("Error loading price settings data:", err);
        setError("Failed to load price data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Update settings and save to localStorage
  const updateSettings = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem("priceSettings", JSON.stringify(newSettings));

    // Notify parent component if provided
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  // Handle store change when country changes
  useEffect(() => {
    const loadStores = async () => {
      if (!settings.country) return;

      setIsLoading(true);
      try {
        const storeList = await getStores(settings.country);
        setStores(storeList);

        // Reset selected store if it's no longer available
        if (
          settings.preferredStoreId &&
          !storeList.some((s) => s.id === settings.preferredStoreId)
        ) {
          updateSettings("preferredStoreId", "");
        }
      } catch (err) {
        console.error("Error loading stores:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadStores();
  }, [settings.country]);

  // Common countries for the dropdown
  const countries = [
    { code: "US", name: "United States" },
    { code: "CA", name: "Canada" },
    { code: "GB", name: "United Kingdom" },
    { code: "FR", name: "France" },
    { code: "DE", name: "Germany" },
    { code: "IT", name: "Italy" },
    { code: "ES", name: "Spain" },
    { code: "AU", name: "Australia" },
    { code: "IN", name: "India" },
    { code: "BR", name: "Brazil" },
  ];

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Price Data Settings</h2>

      {error && (
        <div className="p-3 mb-4 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Enable Open Prices API */}
        <div className="flex items-center justify-between">
          <label
            htmlFor="useOpenPricesApi"
            className="text-sm font-medium text-gray-700"
          >
            Use Open Food Facts Price Database
          </label>
          <div className="relative inline-block w-10 mr-2 align-middle select-none">
            <input
              type="checkbox"
              id="useOpenPricesApi"
              checked={settings.useOpenPricesApi}
              onChange={(e) =>
                updateSettings("useOpenPricesApi", e.target.checked)
              }
              className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
            />
            <label
              htmlFor="useOpenPricesApi"
              className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${
                settings.useOpenPricesApi ? "bg-blue-500" : "bg-gray-300"
              }`}
            ></label>
          </div>
        </div>

        {settings.useOpenPricesApi && (
          <>
            {/* Country Selection */}
            <div>
              <label
                htmlFor="country"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Your Country
              </label>
              <select
                id="country"
                value={settings.country}
                onChange={(e) => updateSettings("country", e.target.value)}
                className="p-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Used to find prices relevant to your region
              </p>
            </div>

            {/* Store Selection */}
            <div>
              <label
                htmlFor="preferredStore"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Preferred Store
              </label>
              <select
                id="preferredStore"
                value={settings.preferredStoreId}
                onChange={(e) =>
                  updateSettings("preferredStoreId", e.target.value)
                }
                className="p-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading || stores.length === 0}
              >
                <option value="">Any store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} {store.brand ? `(${store.brand})` : ""}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Prices will be prioritized from your preferred store when
                available
              </p>
            </div>

            {/* Cache Settings */}
            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="cacheEnabled"
                  checked={settings.cacheEnabled}
                  onChange={(e) =>
                    updateSettings("cacheEnabled", e.target.checked)
                  }
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="cacheEnabled"
                  className="ml-2 block text-sm font-medium text-gray-700"
                >
                  Cache price data
                </label>
              </div>

              {settings.cacheEnabled && (
                <div className="pl-6">
                  <label
                    htmlFor="cacheDuration"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Cache Duration (hours)
                  </label>
                  <input
                    type="number"
                    id="cacheDuration"
                    min="1"
                    max="168"
                    value={settings.cacheDuration}
                    onChange={(e) =>
                      updateSettings("cacheDuration", parseInt(e.target.value))
                    }
                    className="p-2 w-24 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    How long to keep price data before refreshing (1-168 hours)
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Information about price data */}
        <div className="mt-6 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
          <h3 className="font-semibold mb-1">
            About Open Food Facts Price Data
          </h3>
          <p className="mb-2">
            Price data is sourced from the Open Food Facts Open Prices database,
            a community-maintained dataset of food prices around the world.
          </p>
          <p>
            <a
              href="https://prices.openfoodfacts.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              Learn more about Open Prices
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PriceSettings;
