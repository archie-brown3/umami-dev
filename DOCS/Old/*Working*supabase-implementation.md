# Supabase Implementation Documentation

## Overview

This document provides a comprehensive overview of the current Supabase implementation in the Recipe Saver app. It describes how authentication and database connectivity have been implemented, with particular focus on ensuring reliable operation across platforms, especially iOS.

## Core Implementation

### Client Configuration

The Supabase client is initialized with platform-specific optimizations:

- **Authentication**: Uses PKCE flow with persistent sessions
- **iOS Adaptations**: Extended timeouts, native fetch implementation
- **Storage**: Custom implementation that works across web and native platforms

```typescript
// Client configuration with platform-specific settings
const options = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: "pkce",
    storage: createStorage(),
    storageKey: "recipe-saver-auth-token",
    debug: import.meta.env.DEV,
    timeout: isIOS ? 90000 : 30000, // Longer timeout for iOS
  },
  global: {
    headers: {
      "X-Client-Info": `RecipeSaver/${isIOS ? "iOS" : "app"} @1.0.0`,
      "Content-Type": "application/json",
    },
    // Use native fetch implementation for iOS
    fetch: createNativeFetch(),
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
};
```

### iOS Network Handling

Native platform implementations include special handling for iOS network conditions:

- Network status monitoring
- Session refresh on reconnection
- Visibility change detection
- Connection diagnostics

## Debugging Utilities

### Connection Diagnostics

The app includes robust diagnostic tools to test and verify Supabase connectivity:

```typescript
export const diagnoseSupabaseConnection = async (): Promise<string> => {
  try {
    // Test basic connectivity to Supabase
    const start = Date.now();
    const { data, error } = await supabase
      .from("recipes")
      .select("count")
      .limit(1);
    const end = Date.now();

    if (error) {
      // If we get a permission error, that's still a successful connection
      if (
        error.code === "PGRST301" ||
        error.message.includes("permission denied")
      ) {
        return `Connection passed but permission issues detected (${
          end - start
        }ms)`;
      }
      return `Connection failed: ${error.message}`;
    }

    // Now check authentication status
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      return `Connection passed but auth error: ${authError.message}`;
    }

    if (!authData.user) {
      return `Connection passed but not authenticated (${end - start}ms)`;
    }

    return `All connection tests passed (${end - start}ms)`;
  } catch (e) {
    return `Connection test error: ${
      e instanceof Error ? e.message : String(e)
    }`;
  }
};
```

### Native HTTP Testing

For iOS, a specialized HTTP connection test was implemented to verify connectivity:

```typescript
export async function testNativeHttpConnection(
  url: string,
  apiKey: string
): Promise<boolean> {
  // Implementation tests direct HTTP connectivity
  // Returns true if connectivity is working, false otherwise
}
```

### Debug Page

A dedicated debug page provides live diagnostics and troubleshooting tools:

- Authentication status checking
- Database connectivity tests
- Recipe permission verification
- Test recipe creation

## Simplified Recipe Service

A simplified recipe service was implemented to isolate and debug database issues:

```typescript
export const simplifiedRecipeService = {
  async getRecipes() {
    // Simplified implementation for debugging
  },

  async getRecipeById(id: string) {
    // Simplified implementation for debugging
  },

  async fixRecipePermissions() {
    // Utility to fix database permissions
  },

  async createTestRecipe() {
    // Creates a test recipe for debugging
  },
};
```

## Key Changes

The following key changes were made to fix authentication and database connectivity:

1. **Native Fetch Implementation**: Created a custom fetch implementation for iOS to handle network peculiarities
2. **Session Persistence**: Improved session storage and refresh mechanisms
3. **Network Connectivity Handling**: Added robust network state monitoring and recovery
4. **Diagnostic Tools**: Implemented comprehensive debug utilities
5. **Simplified Services**: Created alternative simplified services for isolating issues
6. **Permission Fixes**: Added utilities to verify and fix database permissions

## Platform Considerations

### iOS-Specific Adaptations

- Extended timeout values
- Session refresh on app resume
- Native HTTP implementation
- Connection diagnostic tools

### Web Considerations

- Fallback to standard fetch API
- Local storage for session persistence

## Next Steps

1. Continue monitoring for iOS-specific authentication issues
2. Consider implementing offline capability with local storage
3. Add performance metrics to track database response times
4. Consider implementing retry mechanisms for transient failures
