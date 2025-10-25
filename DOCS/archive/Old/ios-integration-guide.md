# iOS Integration Guide with Capacitor

This guide provides step-by-step instructions for converting our Recipe Saver web application into an iOS app using Capacitor, while maintaining our existing development workflow.

## Overview

Capacitor creates a native wrapper around our web application, allowing us to:

- Deploy the app to the iOS App Store
- Access native device features (camera, storage, etc.)
- Continue developing with our existing React/Vite tech stack

## Prerequisites

- macOS computer (required for iOS development)
- Xcode 15+ installed
- CocoaPods installed
- Apple Developer account (for App Store submission)
- Node.js and npm

## Step 1: Install Capacitor

```bash
# Install Capacitor core packages
npm install @capacitor/core @capacitor/cli @capacitor/ios

# Add commonly used plugins
npm install @capacitor/camera @capacitor/storage @capacitor/keyboard @capacitor/status-bar
```

## Step 2: Initialize Capacitor

```bash
# Initialize Capacitor with your app details
npx cap init "Recipe Saver" com.recipesaver.app --web-dir=dist
```

This creates a `capacitor.config.ts` file in your project root.

## Step 3: Configure Capacitor

Edit `capacitor.config.ts` to include iOS-specific settings:

```typescript
import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.recipesaver.app",
  appName: "Recipe Saver",
  webDir: "dist",
  server: {
    androidScheme: "https",
    iosScheme: "https",
    hostname: "localhost",
  },
  ios: {
    contentInset: "automatic",
    allowsLinkPreview: true,
    scrollEnabled: true,
    backgroundColor: "#ffffff",
    preferredContentMode: "mobile",
  },
};

export default config;
```

## Step 4: Build Your Web App

Before adding iOS platform, build your web application:

```bash
npm run build
```

## Step 5: Add iOS Platform

```bash
npx cap add ios
```

This creates an `ios` directory with a native Xcode project that wraps your web app.

## Step 6: Update iOS Project

When you make changes to your web app, follow these steps to update the iOS project:

```bash
# Build your web app
npm run build

# Update the iOS project with the latest build
npx cap sync ios
```

## Step 7: Open and Configure in Xcode

```bash
npx cap open ios
```

This opens the iOS project in Xcode. Configure the following:

1. **Signing & Capabilities**: Add your Apple Developer account
2. **Display Name**: Set the app name that appears on the home screen
3. **App Icon**: Add your app icon in the Xcode Assets catalog
4. **Splash Screen**: Configure launch screen in `LaunchScreen.storyboard`
5. **Info.plist**: Set privacy descriptions for any permissions your app needs

## Step 8: Test on Simulator or Device

In Xcode:

1. Select a device/simulator from the target dropdown
2. Click the Run button (triangle icon)

## Development Workflow

The key benefit of Capacitor is that it preserves our development workflow:

### Web Development (Most of the Time)

```bash
# Develop as usual using our Vite dev server
npm run dev
```

Continue using your regular web development process with hot reloading, debugging in the browser, etc. All your React components, context providers, and other code remain unchanged.

### Native Testing (When Needed)

```bash
# Build web app
npm run build

# Sync changes to iOS project
npx cap sync ios

# Open in Xcode
npx cap open ios
```

Test on iOS simulator or physical device from Xcode.

## Using Native Device Features

To use native device features, add and configure Capacitor plugins:

```bash
# Example: Add camera functionality
npm install @capacitor/camera

# Then sync the project
npx cap sync ios
```

Use in your React code:

```typescript
import { Camera, CameraResultType } from "@capacitor/camera";

async function takePicture() {
  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: true,
    resultType: CameraResultType.Uri,
  });

  // Use image.webPath to display the photo
  const imageUrl = image.webPath;
}
```

## iOS-Specific Adjustments

Some UI elements may need adjustments for better iOS experience:

1. **Safe Areas**: Respect iOS safe areas for notches and home indicators
2. **Touch Targets**: Ensure buttons and interactive elements are at least 44×44 points
3. **Gestures**: Support iOS-standard gestures (swipe to go back, etc.)
4. **Keyboard Handling**: Adjust layouts when the keyboard appears

## Preparing for App Store Submission

1. **App Store Connect**: Create app entry in App Store Connect
2. **App Icon**: Ensure app icon meets Apple's requirements
3. **Screenshots**: Prepare screenshots for different device sizes
4. **App Description**: Write compelling app description and keywords
5. **Privacy Policy**: Create and link to a privacy policy
6. **Build Archive**: In Xcode, select Product > Archive
7. **Submit**: Use Xcode Organizer to submit the archived app

## Troubleshooting

### Common Issues:

1. **White Screen**: Often caused by path issues. Ensure `webDir` is correct in `capacitor.config.ts`
2. **Plugin Errors**: Run `npx cap sync ios` after installing new plugins
3. **CORS Issues**: iOS enforces strict CORS policies. Add CORS headers to your API server
4. **Build Errors**: Check Xcode logs for specific error messages
5. **Performance**: Optimize large assets, animations, and scripts for mobile performance

## iOS App Fixes

The following tasks address issues with the current iOS implementation:

### Database Connection Issues

1. **Update Network Configuration**

   - [ ] Modify Capacitor config to allow Supabase domain:
     ```typescript
     // In capacitor.config.ts
     server: {
       // ...existing config
       allowNavigation: ["xowvdngkchptbwjxgnjl.supabase.co"],
       cleartext: true
     }
     ```
   - [ ] Run `npx cap sync ios` to update the iOS project

2. **Configure Network Security in Xcode**
   - [ ] Open the iOS project in Xcode: `npx cap open ios`
   - [ ] Find Info.plist in the App/App folder
   - [ ] Add App Transport Security settings:
     ```xml
     <key>NSAppTransportSecurity</key>
     <dict>
       <key>NSAllowsArbitraryLoads</key>
       <true/>
       <key>NSExceptionDomains</key>
       <dict>
         <key>xowvdngkchptbwjxgnjl.supabase.co</key>
         <dict>
           <key>NSIncludesSubdomains</key>
           <true/>
           <key>NSExceptionAllowsInsecureHTTPLoads</key>
           <true/>
         </dict>
       </dict>
     </dict>
     ```

### Storage and State Persistence

1. **Add Capacitor Storage Plugin**

   - [ ] Install Capacitor Preferences plugin:
     ```bash
     npm install @capacitor/preferences
     npx cap sync ios
     ```

2. **Migrate localStorage to Capacitor Preferences**

   - [ ] Update storage implementation:

     ```javascript
     import { Preferences } from "@capacitor/preferences";

     // Example implementation for a storage service
     export const storage = {
       getItem: async (key) => {
         const { value } = await Preferences.get({ key });
         return value;
       },
       setItem: async (key, value) => {
         await Preferences.set({ key, value: String(value) });
       },
       removeItem: async (key) => {
         await Preferences.remove({ key });
       },
     };
     ```

   - [ ] Refactor code using localStorage to use the storage service

### Network Handling

1. **Improve Error Handling**

   - [ ] Add retry mechanism to API calls:
     ```javascript
     const fetchWithRetry = async (fetchFn, retries = 3, delay = 1000) => {
       try {
         return await fetchFn();
       } catch (error) {
         if (retries <= 0) throw error;
         await new Promise((resolve) => setTimeout(resolve, delay));
         return fetchWithRetry(fetchFn, retries - 1, delay);
       }
     };
     ```
   - [ ] Implement fallback to local data:
     ```javascript
     try {
       return await fetchWithRetry(() =>
         supabaseClient.from("recipes").select("*")
       );
     } catch (error) {
       console.error("Falling back to local recipes");
       return getLocalRecipes();
     }
     ```

2. **Network Connectivity Check**

   - [ ] Add network status detection:
     ```bash
     npm install @capacitor/network
     npx cap sync ios
     ```
   - [ ] Use network status to show appropriate UI:

     ```javascript
     import { Network } from "@capacitor/network";

     // Initial status check
     const [isConnected, setIsConnected] = useState(true);

     useEffect(() => {
       const checkConnection = async () => {
         const status = await Network.getStatus();
         setIsConnected(status.connected);
       };
       checkConnection();

       // Listen for changes
       Network.addListener("networkStatusChange", (status) => {
         setIsConnected(status.connected);
       });

       return () => {
         Network.removeAllListeners();
       };
     }, []);
     ```

### UI Layout Improvements

1. **Fix Layout Constraints**

   - [ ] Add safe area insets to all screens:
     ```jsx
     <div className="pb-safe pt-safe pl-safe pr-safe">{/* Content */}</div>
     ```
   - [ ] Add the following to your CSS:
     ```css
     .pb-safe {
       padding-bottom: env(safe-area-inset-bottom, 0px);
     }
     .pt-safe {
       padding-top: env(safe-area-inset-top, 0px);
     }
     .pl-safe {
       padding-left: env(safe-area-inset-left, 0px);
     }
     .pr-safe {
       padding-right: env(safe-area-inset-right, 0px);
     }
     ```

2. **Fix Touch Targets**
   - [ ] Ensure all interactive elements are at least 44x44 points
   - [ ] Add padding to small buttons:
     ```css
     button,
     .button,
     [role="button"] {
       min-height: 44px;
       min-width: 44px;
     }
     ```

## Best Practices

1. **Regular Testing**: Test on iOS frequently during development
2. **Progressive Enhancement**: Use feature detection before accessing native APIs
3. **Offline Support**: Consider implementing offline functionality
4. **Version Sync**: Keep web and native versions in sync
5. **Responsive Design**: Ensure UI works well on various iOS device sizes

## Continue Developing with Same Tech Stack

The beauty of Capacitor is that it's non-intrusive. You can:

1. Continue using Vite, React, and other web technologies
2. Use the same codebase for web and iOS
3. Add platform-specific code only when needed, using capability detection
4. Develop primarily in the browser environment for speed
5. Run periodic iOS-specific tests to ensure compatibility

## Conclusion

Following this guide, you now have a development environment where you can:

1. Build features using your familiar React/Vite stack
2. Test your app both in the browser and on iOS devices
3. Prepare for eventual App Store submission

The Capacitor approach gives you the best of both worlds: web development productivity with native app capabilities.
