import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cached items
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
};

class NetworkManager {
  private networkState: NetworkState = {
    isConnected: false,
    isInternetReachable: null,
    type: "unknown",
  };

  private listeners: Array<(state: NetworkState) => void> = [];
  private cache = new Map<string, { data: any; timestamp: number }>();
  private pendingRequests = new Map<string, Promise<any>>();

  constructor() {
    this.initializeNetworkListener();
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener((state) => {
      this.networkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      };

      console.log("[NetworkManager] Network state changed:", this.networkState);

      // Notify all listeners
      this.listeners.forEach((listener) => listener(this.networkState));
    });
  }

  public getNetworkState(): NetworkState {
    return this.networkState;
  }

  public isOnline(): boolean {
    return (
      this.networkState.isConnected &&
      this.networkState.isInternetReachable !== false
    );
  }

  public addNetworkListener(
    listener: (state: NetworkState) => void
  ): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    operationId?: string
  ): Promise<T> {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

    // Deduplicate identical requests
    if (operationId && this.pendingRequests.has(operationId)) {
      console.log(`[NetworkManager] Deduplicating request: ${operationId}`);
      return this.pendingRequests.get(operationId)!;
    }

    const executeOperation = async (attempt: number = 1): Promise<T> => {
      try {
        console.log(
          `[NetworkManager] Executing operation, attempt ${attempt}/${
            retryConfig.maxRetries + 1
          }`
        );

        // Check network connectivity before attempting
        if (!this.isOnline()) {
          throw new NetworkError(
            "No internet connection",
            "NETWORK_UNAVAILABLE"
          );
        }

        const result = await operation();

        // Clear from pending requests on success
        if (operationId) {
          this.pendingRequests.delete(operationId);
        }

        return result;
      } catch (error) {
        console.error(
          `[NetworkManager] Operation failed on attempt ${attempt}:`,
          error
        );

        // Clear from pending requests on final failure
        if (operationId && attempt > retryConfig.maxRetries) {
          this.pendingRequests.delete(operationId);
        }

        // Don't retry if we've exceeded max retries
        if (attempt > retryConfig.maxRetries) {
          throw error;
        }

        // Don't retry certain types of errors
        if (error instanceof NetworkError && !error.isRetryable()) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          retryConfig.baseDelay *
            Math.pow(retryConfig.backoffFactor, attempt - 1),
          retryConfig.maxDelay
        );

        console.log(`[NetworkManager] Retrying in ${delay}ms...`);
        await this.delay(delay);

        return executeOperation(attempt + 1);
      }
    };

    const promise = executeOperation();

    if (operationId) {
      this.pendingRequests.set(operationId, promise);
    }

    return promise;
  }

  public async getCachedData<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    config: Partial<CacheConfig> = {}
  ): Promise<T> {
    const cacheConfig = { ...DEFAULT_CACHE_CONFIG, ...config };
    const cached = this.cache.get(key);

    // Return cached data if it's still valid
    if (cached && Date.now() - cached.timestamp < cacheConfig.ttl) {
      console.log(`[NetworkManager] Returning cached data for key: ${key}`);
      return cached.data;
    }

    // If offline, return stale cache if available
    if (!this.isOnline() && cached) {
      console.log(
        `[NetworkManager] Returning stale cached data (offline) for key: ${key}`
      );
      return cached.data;
    }

    try {
      // Fetch fresh data
      console.log(`[NetworkManager] Fetching fresh data for key: ${key}`);
      const data = await fetchFunction();

      // Cache the result
      this.setCachedData(key, data, cacheConfig);

      return data;
    } catch (error) {
      // If fetch fails and we have cached data, return it
      if (cached) {
        console.log(
          `[NetworkManager] Fetch failed, returning stale cached data for key: ${key}`
        );
        return cached.data;
      }

      throw error;
    }
  }

  public setCachedData<T>(
    key: string,
    data: T,
    config: Partial<CacheConfig> = {}
  ): void {
    const cacheConfig = { ...DEFAULT_CACHE_CONFIG, ...config };

    // Implement LRU cache eviction
    if (this.cache.size >= cacheConfig.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    console.log(`[NetworkManager] Cached data for key: ${key}`);
  }

  public clearCache(keyPattern?: string): void {
    if (keyPattern) {
      const regex = new RegExp(keyPattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
      console.log(
        `[NetworkManager] Cleared cache entries matching pattern: ${keyPattern}`
      );
    } else {
      this.cache.clear();
      console.log("[NetworkManager] Cleared entire cache");
    }
  }

  public async persistOfflineAction(action: OfflineAction): Promise<void> {
    try {
      const existingActions = await this.getOfflineActions();
      const updatedActions = [
        ...existingActions,
        { ...action, timestamp: Date.now() },
      ];

      await AsyncStorage.setItem(
        "offline_actions",
        JSON.stringify(updatedActions)
      );
      console.log("[NetworkManager] Persisted offline action:", action.type);
    } catch (error) {
      console.error(
        "[NetworkManager] Failed to persist offline action:",
        error
      );
    }
  }

  public async getOfflineActions(): Promise<OfflineAction[]> {
    try {
      const actionsJson = await AsyncStorage.getItem("offline_actions");
      return actionsJson ? JSON.parse(actionsJson) : [];
    } catch (error) {
      console.error("[NetworkManager] Failed to get offline actions:", error);
      return [];
    }
  }

  public async syncOfflineActions(): Promise<void> {
    if (!this.isOnline()) {
      console.log(
        "[NetworkManager] Cannot sync offline actions - no internet connection"
      );
      return;
    }

    try {
      const actions = await this.getOfflineActions();
      console.log(`[NetworkManager] Syncing ${actions.length} offline actions`);

      const syncPromises = actions.map(async (action) => {
        try {
          await this.executeOfflineAction(action);
          return { success: true, action };
        } catch (error) {
          console.error(
            `[NetworkManager] Failed to sync action ${action.type}:`,
            error
          );
          return { success: false, action, error };
        }
      });

      const results = await Promise.allSettled(syncPromises);

      // Remove successfully synced actions
      const failedActions = results
        .filter(
          (result, index) =>
            result.status === "rejected" ||
            (result.status === "fulfilled" && !result.value.success)
        )
        .map((_, index) => actions[index]);

      await AsyncStorage.setItem(
        "offline_actions",
        JSON.stringify(failedActions)
      );

      const syncedCount = actions.length - failedActions.length;
      console.log(
        `[NetworkManager] Synced ${syncedCount}/${actions.length} offline actions`
      );
    } catch (error) {
      console.error("[NetworkManager] Failed to sync offline actions:", error);
    }
  }

  private async executeOfflineAction(action: OfflineAction): Promise<void> {
    // This would be implemented based on your specific action types
    console.log(`[NetworkManager] Executing offline action: ${action.type}`);

    switch (action.type) {
      case "ADD_SHOPPING_ITEM":
        // Implement shopping item addition
        break;
      case "UPDATE_SHOPPING_ITEM":
        // Implement shopping item update
        break;
      case "DELETE_SHOPPING_ITEM":
        // Implement shopping item deletion
        break;
      default:
        console.warn(
          `[NetworkManager] Unknown offline action type: ${action.type}`
        );
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class NetworkError extends Error {
  public readonly code: string;
  public readonly isRetryableError: boolean;

  constructor(message: string, code: string, isRetryable: boolean = true) {
    super(message);
    this.name = "NetworkError";
    this.code = code;
    this.isRetryableError = isRetryable;
  }

  public isRetryable(): boolean {
    // Don't retry client errors (4xx) or certain server errors
    const nonRetryableCodes = [
      "UNAUTHORIZED",
      "FORBIDDEN",
      "NOT_FOUND",
      "VALIDATION_ERROR",
      "RATE_LIMITED",
    ];

    return this.isRetryableError && !nonRetryableCodes.includes(this.code);
  }

  public static fromHttpStatus(status: number, message?: string): NetworkError {
    const defaultMessage = message || `HTTP ${status}`;

    if (status >= 400 && status < 500) {
      // Client errors - usually not retryable
      return new NetworkError(defaultMessage, `HTTP_${status}`, false);
    } else if (status >= 500) {
      // Server errors - retryable
      return new NetworkError(defaultMessage, `HTTP_${status}`, true);
    } else {
      // Other errors
      return new NetworkError(defaultMessage, `HTTP_${status}`, true);
    }
  }
}

export interface OfflineAction {
  type: string;
  payload: any;
  timestamp?: number;
  retryCount?: number;
}

// Singleton instance
export const networkManager = new NetworkManager();

// Utility functions
export const withNetworkRetry = <T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>
) => {
  return networkManager.executeWithRetry(operation, config);
};

export const withCache = <T>(
  key: string,
  fetchFunction: () => Promise<T>,
  config?: Partial<CacheConfig>
) => {
  return networkManager.getCachedData(key, fetchFunction, config);
};

export const isOnline = () => networkManager.isOnline();

export const addNetworkListener = (listener: (state: NetworkState) => void) => {
  return networkManager.addNetworkListener(listener);
};
