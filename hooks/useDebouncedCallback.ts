import { useCallback, useRef } from "react";

/**
 * Custom hook that creates a debounced version of a callback function
 * @param callback The function to debounce
 * @param delay The delay in milliseconds
 * @returns A debounced version of the callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // Clear the previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a new timeout
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  return debouncedCallback;
}

/**
 * Custom hook that creates a debounced version of a callback with immediate execution option
 * @param callback The function to debounce
 * @param delay The delay in milliseconds
 * @param immediate Whether to execute immediately on first call
 * @returns A debounced version of the callback
 */
export function useDebouncedCallbackWithImmediate<
  T extends (...args: any[]) => any
>(callback: T, delay: number, immediate = false): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const immediateRef = useRef<boolean>(immediate);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      const callNow = immediate && !timeoutRef.current;

      // Clear the previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a new timeout
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        if (!immediate) {
          callback(...args);
        }
      }, delay);

      // Execute immediately if needed
      if (callNow) {
        callback(...args);
      }
    },
    [callback, delay, immediate]
  ) as T;

  return debouncedCallback;
}
