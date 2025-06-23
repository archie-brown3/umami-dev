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
    // Enable Apple Sign In capability
    usesAppleSignIn: true,
    infoPlist: {
      // Camera permission for taking recipe photos and text recognition
      NSCameraUsageDescription:
        "Umami uses the camera to take photos of your recipes and extract text from recipe images using AI-powered text recognition.",

      // Photo library permissions for selecting recipe images
      NSPhotoLibraryUsageDescription:
        "Umami needs access to your photo library to let you select photos for your recipes and save recipe images.",
      NSPhotoLibraryAddUsageDescription:
        "Umami can save recipe photos to your photo library for easy access and backup.",

      // Microphone permission (may be required by some camera implementations)
      NSMicrophoneUsageDescription:
        "Umami may use the microphone when recording cooking videos or voice notes for your recipes.",

      // Face ID / Touch ID for secure access (if using biometric authentication)
      NSFaceIDUsageDescription:
        "Umami can use Face ID or Touch ID to securely access your recipe collection.",

      // Location services (if implementing location-based features in the future)
      NSLocationWhenInUseUsageDescription:
        "Umami can use your location to suggest local ingredients and restaurants near you.",

      // Contacts (if implementing recipe sharing features)
      NSContactsUsageDescription:
        "Umami can access your contacts to easily share recipes with friends and family.",

      // Speech recognition (if implementing voice-to-text features)
      NSSpeechRecognitionUsageDescription:
        "Umami can use speech recognition to help you add recipe instructions by voice.",

      // Apple Sign In URL schemes
      CFBundleURLTypes: [
        {
          CFBundleURLName: "apple-sign-in",
          CFBundleURLSchemes: ["io.recipesaver.app"],
        },
        {
          CFBundleURLName: "app-scheme",
          CFBundleURLSchemes: ["umami-dev"],
        },
      ],
    },
  },
  android: {
    adaptiveIcon: {
      // foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    package: "io.recipesaver.app",
    permissions: [
      // Camera permissions
      "android.permission.CAMERA",
      "android.permission.RECORD_AUDIO",

      // Storage permissions
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.WRITE_EXTERNAL_STORAGE",
      "android.permission.READ_MEDIA_IMAGES",

      // Network permissions
      "android.permission.INTERNET",
      "android.permission.ACCESS_NETWORK_STATE",

      // Optional permissions for future features
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
    ],
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
    // Apple Authentication plugin - REQUIRED for TestFlight
    "expo-apple-authentication",
    [
      "expo-image-picker",
      {
        photosPermission:
          "Umami needs access to your photos to select recipe images.",
        cameraPermission:
          "Umami uses the camera to take photos of your recipes.",
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission:
          "Umami uses the camera to take photos of recipes and extract text from recipe images.",
      },
    ],
    [
      "expo-media-library",
      {
        photosPermission:
          "Umami needs photo library access to save and organize your recipe images.",
        savePhotosPermission:
          "Umami can save recipe photos to your photo library.",
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
