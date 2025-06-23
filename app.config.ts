import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Umami",
  slug: "umami-dev",
  version: "2.0.2",
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
      projectId: "8c925526-896e-49cf-8e9d-60f6540d4a20",
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
  owner: "mightyarch",
});
