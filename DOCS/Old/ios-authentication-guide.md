# iOS Authentication with Supabase

This document provides a comprehensive guide to our implementation of Supabase authentication for the iOS version of the Recipe Saver app. It includes troubleshooting steps, common issues, and explanations of our custom solutions.

## Overview

iOS WebView applications face unique challenges with authentication due to security restrictions. This document explains how we've addressed these challenges for our Recipe Saver app.

## Current Implementation

We've implemented a robust authentication system specifically for iOS that includes:

1. **Custom HTTP Transport**: Using `@capacitor-community/http` to bypass WebView limitations
2. **Enhanced Session Management**: Proactive session refreshing and validation
3. **Smart Authentication Flow**: Multiple authentication methods with fallbacks
4. **Comprehensive Logging**: Detailed logs for troubleshooting

## Implementation Details

### 1. Native HTTP Transport

iOS WebView restricts certain HTTP requests, especially for authentication. We've implemented a custom fetch adapter:

- Located in: `src/utils/supabase/nativeFetch.ts`
- Uses: `@capacitor-community/http` for native network requests
- Key Function: `createNativeFetch()` - Creates a fetch-compatible adapter for Supabase

This bypasses WebKit's security restrictions by using native networking APIs rather than the WebView's network stack.

### 2. Enhanced Authentication Methods

We've implemented multiple authentication approaches with fallbacks:

- Located in: `src/utils/supabase/iosAuth.ts`
- Primary Function: `signInWithEmailPassword()` - Tries multiple auth methods:
  1. Standard Supabase auth flow
  2. Direct API authentication using native HTTP
  3. Manual session handling and storage

### 3. Session Management

We've added proactive session management to prevent authentication issues:

- Located in: `src/utils/supabase/iOSSessionManager.ts`
- Key Functions:
  - `initializeIOSSessionManager()` - Sets up listeners and timers
  - `checkAndRefreshSession()` - Proactively refreshes sessions before expiry
  - `validateIOSSession()` - Validates existing sessions

This manager monitors session state and automatically refreshes when needed, helping prevent common authentication failures.

### 4. OAuth Implementation

Our OAuth implementation for iOS uses deep linking:

- Located in: `src/components/AuthCallback.tsx`
- Key Feature: Handles OAuth redirects by capturing and processing URL parameters
- Works with: Apple, Google, and other OAuth providers

### 5. Configuration Changes

We've updated several configuration files:

- `capacitor.config.ts`: Added HTTP plugin configuration and deep linking settings
- `ios/App/App/Info.plist`: Updated network security settings
- `ios/App/App/App.entitlements`: Added associated domains for deep linking

## Common Issues and Solutions

### 1. "Session not found" or "Invalid session"

**Symptoms:**

- User is unexpectedly logged out
- Authentication errors after app background/foreground transitions

**Solutions:**

- Our session manager proactively refreshes sessions before expiry
- Manual refresh can be triggered: `await checkAndRefreshSession()`
- Clear any stale session data and re-authenticate: `await supabase.auth.signOut({ scope: "local" })`

### 2. OAuth Login Failures

**Symptoms:**

- OAuth popup closes but user isn't logged in
- Redirect to callback URL fails
- Deep linking doesn't work

**Solutions:**

- Ensure deep linking is properly configured in `Info.plist`
- Check custom URL scheme: `recipesaver://` or `io.recipesaver://`
- Verify OAuth settings in Supabase dashboard
- Add more logging in `AuthCallback.tsx`

### 3. Network Request Failures

**Symptoms:**

- Requests to Supabase fail with network errors
- Authentication requests time out

**Solutions:**

- Verify network connectivity
- Check App Transport Security settings in `Info.plist`
- Test connection with `testNativeHttpConnection()`

## Testing Your Authentication Implementation

### 1. Basic Authentication Test

```typescript
// In a test component
import { signInWithEmailPassword } from "@/utils/supabase/iosAuth";

const testAuth = async () => {
  const result = await signInWithEmailPassword("test@example.com", "password");
  console.log("Auth result:", result);
};
```

### 2. Session Validation Test

```typescript
// Verify session is valid and properly refreshed
import {
  validateIOSSession,
  checkAndRefreshSession,
} from "@/utils/supabase/iOSSessionManager";

const testSession = async () => {
  const isValid = await validateIOSSession();
  console.log("Session valid:", isValid);

  if (!isValid) {
    const refreshed = await checkAndRefreshSession();
    console.log("Session refreshed:", refreshed);
  }
};
```

### 3. OAuth Test

For OAuth testing, you'll need to:

1. Configure your OAuth provider in Supabase dashboard
2. Ensure deep linking is properly set up in iOS app
3. Test the flow end-to-end

## Implementation Notes

### iOS Session Expiry

iOS WebView's may clear cookies and storage during app backgrounding. Our session manager addresses this by:

1. Proactively refreshing tokens before expiry
2. Storing tokens in Capacitor's secure storage
3. Manually setting sessions when needed

### HTTP Request Timeout Settings

Authentication requests can be slow, especially on poor connections. We've configured longer timeouts:

```typescript
const connectTimeout = isAuthEndpoint ? 90000 : 30000;
const readTimeout = isAuthEndpoint ? 90000 : 30000;
```

### Debug Logging

We've implemented comprehensive logging for authentication flows:

- Network requests: `[NetworkDebug]` prefix
- Authentication: `[Auth]` prefix
- iOS-specific auth: `[iOSAuth]` prefix
- Session management: `[iOSSessionManager]` prefix

Enable console logging in the iOS app to capture these for troubleshooting.

## Future Improvements

1. **Biometric Authentication**: Integrate with iOS Face ID/Touch ID
2. **Enhanced Offline Authentication**: Caching credentials for offline login
3. **Automatic Error Recovery**: More sophisticated retry mechanisms
4. **Deeper Analytics**: Track authentication success rates and failure reasons

## References

1. [Supabase iOS Authentication Docs](https://supabase.com/docs/guides/auth/native-mobile-deep-dive/auth-with-ios)
2. [Capacitor HTTP Plugin](https://capacitorjs.com/docs/apis/http)
3. [iOS WebView Authentication Issues](https://developer.apple.com/forums/thread/109206)
4. [Capacitor Deep Linking](https://capacitorjs.com/docs/apis/app#handling-deep-links)
