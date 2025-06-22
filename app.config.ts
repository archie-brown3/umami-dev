import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Umami",
  slug: "umami-dev",
  version: "1.0.0",
  orientation: "portrait",
  // Temporarily remove icon references until we have proper assets
  // icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    // image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "io.recipesaver.app",
    config: {
      usesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      // foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "io.recipesaver.app",
  },
  web: {
    // favicon: "./assets/favicon.png",
  },
  extra: {
    eas: {
      projectId: "your-project-id",
    },
  },
  plugins: [
    "expo-router",
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "15.1",
        },
      },
    ],
  ],
  scheme: "umami-dev",
  experiments: {
    tsconfigPaths: true,
    typedRoutes: true,
  },
  owner: "your-expo-username",
});
