# Network Monitoring and Offline Support

This document explains how to use the network monitoring and offline support features in the Recipe Saver app.

## Overview

The app includes a comprehensive network monitoring system to:

- Detect network connectivity changes
- Display network status to users
- Handle offline scenarios gracefully
- Queue operations for execution when back online
- Provide fallbacks for offline use

## Components

### 1. NetworkContext

A React context that provides network information throughout the app:

```tsx
import { useNetwork } from "@/context/NetworkContext";

function MyComponent() {
  const {
    isOnline,
    isOffline,
    connectionType,
    lastConnectedTime,
    lastDisconnectedTime,
    wasRecentlyDisconnected,
  } = useNetwork();

  // Use network status in your component
}
```

### 2. NetworkStatusBar

A UI component that displays network status:

```tsx
import { NetworkStatusBar } from "@/components/NetworkStatusBar";

// In your layout or component
<NetworkStatusBar />;
```

This will show:

- A banner when the user goes offline
- A temporary "Back Online" notification when connectivity returns
- A refresh button to reload the app

### 3. Network Utilities

Utility functions for network-aware operations:

- `checkNetworkConnectivity()`: Check if device is online
- `withNetworkCheck()`: Run functions with network checks and fallbacks
- `retryWhenOnline()`: Retry operations when network becomes available
- `NetworkOperationQueue`: Queue operations for when network returns

## Handling API Calls

Follow this pattern for API calls:

```tsx
import { withNetworkCheck } from "@/utils/networkUtils";

async function fetchData() {
  return withNetworkCheck(
    // Online operation
    async () => {
      // Your API call here
      const response = await fetch("/api/endpoint");
      return await response.json();
    },
    // Offline fallback (optional)
    () => {
      // Return cached data or fallback
      return localStorage.getItem("cached_data");
    }
  );
}
```

## Queuing Operations for Online Sync

For operations that should be queued for when the device is back online:

```tsx
import { NetworkOperationQueue } from "@/utils/networkUtils";

// Queue an operation
NetworkOperationQueue.addOperation(async () => {
  // This will run when the device is back online
  await saveDataToServer(myData);
});
```

## Offline-First Strategy

For the best user experience:

1. **Cache Essential Data**: Cache important data during online sessions
2. **Provide Offline Fallbacks**: Always include offline fallbacks for critical features
3. **Queue Write Operations**: When offline, queue writes for later execution
4. **Show Clear Status**: Inform users about offline mode and pending sync
5. **Handle Conflicts**: Implement strategies for conflict resolution when syncing

## Example Implementation

See `src/services/networkAwareApi.ts` for a complete example of:

- Saving data with offline queueing
- Fetching data with offline cache fallback
- Retrying operations when network connectivity returns

## Best Practices

1. Always wrap network operations in `withNetworkCheck`
2. Provide appropriate fallbacks for offline scenarios
3. Cache necessary data proactively
4. Include clear UI indicators for network status
5. Test both online and offline scenarios

## Testing Offline Mode

During development, test offline capabilities by:

1. Use browser dev tools to toggle "Offline" mode
2. In the iOS Simulator, choose "Device > Cellular > No Signal"
3. On physical devices, enable airplane mode

## Troubleshooting

- **Capacitor Network Plugin Issues**: Check Capacitor logs for network-related errors
- **Offline Queue Not Processing**: Verify that `NetworkOperationQueue.initialize()` is called
- **Network Status Not Updating**: Ensure Network listeners are properly set up
