# Supabase Troubleshooting Guide

## ✅ Complete Supabase Integration Checklist

Follow this step-by-step guide to get Supabase fully working in the Recipe Saver app:

### 1. Setup & Configuration

- [ ] Verify environment variables in `.env` file:
  ```
  VITE_SUPABASE_URL=your-project-url.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  VITE_SUPABASE_REDIRECT_URL=io.recipesaver://login
  VITE_SUPABASE_REDIRECT_SCHEME=io.recipesaver
  VITE_MOBILE_PLATFORM=ios
  ```
- [ ] Install required dependencies:
  ```bash
  npm install @supabase/supabase-js @capacitor-community/http @react-native-async-storage/async-storage
  npx cap sync ios
  ```
- [ ] Update iOS specific configurations in `Info.plist`:
  - [x] Add `WKAppBoundDomains` array with Supabase domains
  - [x] Set `WKAppBoundDomainsEnabled` to `false`
  - [x] Update `NSAppTransportSecurity` to allow necessary connections
  - [x] Verify custom URL scheme in `CFBundleURLTypes` is set to `recipesaver`

### 2. Authentication Implementation

- [ ] Verify the native fetch adapter in `src/utils/supabase/nativeFetch.ts` includes proper auth handling:
  ```typescript
  // Add special handling for auth endpoints
  if (url.includes("/auth/v1/")) {
    console.log(`[Auth] Using enhanced auth handling for: ${url}`);
    // Add custom headers needed for auth
    headers["X-Client-Info"] = "RecipeSaver/iOS";
  }
  ```
- [ ] Update PKCE auth flow configuration in Supabase client:

```typescript
// In supabase.ts
const options = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: "pkce" as const,
    storage: createStorage(),
    // Set longer timeout for auth operations
    timeout: 60000,
  },
};
```

- [ ] Implement Deep Link handling for OAuth authentication:

```typescript
// Add to App.tsx or main component
import { App as CapApp } from "@capacitor/app";

// Set up deep link handler
useEffect(() => {
  if (Capacitor.isNativePlatform()) {
    CapApp.addListener("appUrlOpen", ({ url }) => {
      if (url.includes("recipesaver://login")) {
        console.log("Deep link detected:", url);
        // Extract auth tokens and handle them
        // ...
      }
    });
  }
  return () => {
    CapApp.removeAllListeners();
  };
}, []);
```

### 3. Data Access & Testing

- [ ] Implement a comprehensive connection test:

```typescript
// Add to your initialization code
async function testSupabaseConnections() {
  console.log("Testing Supabase connections...");

  // Test 1: Public health endpoint
  try {
    const healthResponse = await fetch(`${supabaseUrl}/rest/v1/`);
    console.log(`Health check: ${healthResponse.status}`);
  } catch (e) {
    console.error("Health check failed:", e);
  }

  // Test 2: Auth endpoint
  try {
    const { error } = await supabase.auth.getSession();
    console.log(`Auth check: ${error ? "Failed" : "Success"}`);
  } catch (e) {
    console.error("Auth check failed:", e);
  }

  // Test 3: Data access
  try {
    const { data, error } = await supabase
      .from("recipes")
      .select("count", { count: "exact", head: true });
    console.log(`Data check: ${error ? "Failed" : "Success"}`);
  } catch (e) {
    console.error("Data check failed:", e);
  }
}
```

- [ ] Test all auth methods with detailed logging:
  - [ ] Password login
  - [ ] Magic link login
  - [ ] Social login (Google, Apple)

### 4. Mobile-Specific Optimizations

- [ ] Ensure proper session and token storage:

```typescript
// Update storage implementation
function createStorage() {
  return {
    getItem: async (key: string) => {
      if (Capacitor.isNativePlatform()) {
        // Use secure storage on mobile
        return await jsonStorage.getItem(key);
      } else {
        return localStorage.getItem(key);
      }
    },
    // ... setItem and removeItem implementations
  };
}
```

- [ ] Add session recovery logic for app foreground/background transitions:

```typescript
// Add to main component
document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState === "visible") {
    console.log("App came foreground, refreshing auth...");
    await supabase.auth.refreshSession();
  }
});
```

- [ ] Add offline detection and handling:

```typescript
import { Network } from "@capacitor/network";

// Listen for network status changes
Network.addListener("networkStatusChange", (status) => {
  console.log("Network status changed:", status.connected);
  if (status.connected) {
    // Reconnect to Supabase and sync any cached changes
  }
});
```

## Quick Overview

iOS is blocking connections to Supabase, causing authentication and data loading to fail. We've implemented a partial solution, but more work is needed to fully fix authentication.

## Current Status

- ✅ Basic data requests to Supabase now work through our custom adapter
- ❌ Authentication still fails on iOS due to special requirements
- ⚠️ Associated Domains capability requires a paid Apple Developer account

## The Problem (In Simple Terms)

When using the app on iOS:

1. The app tries to talk to Supabase (our database)
2. iOS security blocks these connections
3. This causes login failures and data not loading
4. We can see error messages like "Failed to resolve host" in logs

## What We've Already Done

1. Created a special adapter (`nativeFetch.ts`) that helps bypass iOS restrictions
2. Updated the Supabase client to use this adapter
3. Made configuration changes in iOS settings
4. Added connection testing to verify when things work

However, this solution only partially works - authentication still fails.

## Why Authentication Is Still Failing

1. **Different Connection Requirements**: Authentication uses a special process that our adapter doesn't fully handle
2. **iOS Security Features**: iOS has strict security rules for authentication flows

3. **Missing Capabilities**: We need "Associated Domains" capability, which requires a paid Apple Developer account

4. **Network Isolation**: iOS prevents the web component from making certain network requests

## How To Fix Authentication

### Option 1: Enhance the Native Adapter

```typescript
// In nativeFetch.ts, add special handling for auth URLs
if (url.includes("/auth/v1/")) {
  console.log("[Auth] Using special auth handling for: " + url);
  // Special handling for auth endpoints
  // ...
}
```

### Option 2: Create a Direct Auth Method

1. Create a separate login function that uses direct HTTP requests
2. Manually handle token storage and refresh
3. Skip the browser-based auth flow entirely

### Option 3: Add Detailed Debugging

Add specific logging for authentication attempts:

```typescript
// Add to your auth code
console.log("[Auth] Attempting to sign in with", email);
console.log("[Auth] Using transport:", isIOS ? "native" : "browser");
```

### Option 4: Try Different Auth Methods

If password login doesn't work, try:

- Magic link authentication
- Social login (if configured)
- One-time passwords

## Testing Your Fix

1. **Clear App Data**: Delete and reinstall the app
2. **Try Different Networks**: Test on WiFi and cellular data
3. **Check Logs**: Look for auth-specific errors
4. **Verify Tokens**: Print out auth tokens to confirm they're being received

## Current Implementation

Our current solution uses a native HTTP adapter that bypasses WebKit's networking limitations:

1. **Custom Fetch Adapter**: Created in `src/utils/supabase/nativeFetch.ts`

   - Implements a fetch-compatible API
   - Uses `@capacitor-community/http` for native HTTP on iOS
   - Falls back to browser fetch on other platforms

2. **Supabase Integration**: Updated in `src/lib/supabase.ts`
   - Passes the custom fetch implementation to Supabase client
   - Handles platform detection and storage persistence

Here's a simplified overview of the implementation:

```typescript
// in nativeFetch.ts
export const createNativeFetch = () => {
  const isIOS =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    if (!isIOS) {
      return fetch(url, options);
    }

    try {
      // Convert fetch request to Capacitor HTTP format
      const response = await Http.request({
        method: options.method || "GET",
        url,
        headers,
        data,
        // ...other options
      });

      // Convert response back to fetch Response format
      return new Response(responseBody, responseInit);
    } catch (error) {
      // Handle errors appropriately
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
  };
};

// in supabase.ts
const options = {
  // ...other options
  global: {
    // Use native fetch implementation
    fetch: createNativeFetch(),
  },
};

export const supabase = createClient(
  cleanSupabaseUrl,
  supabaseAnonKey,
  options
);
```

## Troubleshooting Checklist

### Configuration Items

- [x] Update `WKAppBoundDomains` in `Info.plist`
- [x] Set `WKAppBoundDomainsEnabled` to `false` in `Info.plist`
- [x] Update `NSAppTransportSecurity` in `Info.plist`
- [x] Update `capacitor.config.ts`: remove `overrideUserAgent` and `appendUserAgent`
- [x] Run `npx cap sync ios`
- [x] Clean build folder in Xcode
- [x] Rebuild project
- [ ] **Fix Xcode Capabilities (Associated Domains - REQUIRES PAID APPLE DEVELOPER ACCOUNT)**
- [x] Verify `Info.plist` Custom URL Scheme (`CFBundleURLTypes` - Verified OK)

### Error Messages to Look For

When authentication fails, you might see these errors:

```
[error] - [Auth] Sign in error: {"__isAuthError":true,"name":"AuthRetryableFetchError","status":0}
```

```
Failed to resolve host network app id to config: bundleID: com.apple.WebKit.Networking
```

These indicate that iOS is blocking the connection to Supabase's authentication servers.

## Need More Help?

1. Check the Supabase documentation about [Auth with iOS](https://supabase.com/docs/guides/auth/native-mobile-deep-dive/auth-with-ios)
2. Look at Capacitor HTTP plugin documentation for [special iOS requirements](https://capacitorjs.com/docs/apis/http)
3. Consider using a paid Apple Developer account to access Associated Domains capability

## Implemented Solutions

To address the iOS authentication issues, we've implemented the following solutions:

1. **Enhanced iOS Session Manager**: Created a dedicated iOS session manager that proactively refreshes authentication tokens and monitors session state.

   - Implementation: `src/utils/supabase/iOSSessionManager.ts`
   - Features: Automatic session refresh, background/foreground handling, validity checks

2. **Improved Authentication Callback**: Updated the OAuth callback handler with better error handling and iOS-specific session management.

   - Implementation: `src/components/AuthCallback.tsx`
   - Features: Better error reporting, fallback mechanisms, iOS deep link processing

3. **HTTP Plugin Configuration**: Added explicit configuration for the Capacitor HTTP plugin in the app configuration.

   - Implementation: Updated `capacitor.config.ts`
   - Features: Enabled native HTTP transport for authentication requests

4. **Session Refresh Logic**: Enhanced the session refresh function with multiple fallback methods and better error handling.

   - Implementation: `src/utils/supabase/iosAuth.ts`
   - Features: Multiple refresh attempts, session validation, error recovery

5. **Improved Authentication Context**: Updated the auth context to integrate with the iOS session manager.

   - Implementation: `src/context/AuthContext.tsx`
   - Features: Platform-specific auth flows, enhanced session validation

6. **Application Initialization**: Added iOS session management initialization to the app startup process.

   - Implementation: `src/main.tsx`
   - Features: Early session validation, proactive refresh setup

7. **Comprehensive Documentation**: Created detailed documentation on iOS authentication implementation.
   - Implementation: `docs/ios-authentication-guide.md`
   - Features: Troubleshooting steps, implementation details, testing procedures

These changes work together to create a robust authentication system that can handle the unique challenges of iOS WebView-based applications.

## Testing Your Fix

1. **Clear App Data**: Delete and reinstall the app
2. **Try Different Networks**: Test on WiFi and cellular data
3. **Check Logs**: Look for auth-specific errors
4. **Verify Tokens**: Print out auth tokens to confirm they're being received
