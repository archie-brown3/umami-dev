import { Platform } from "react-native";
import { format, isToday, isYesterday } from "date-fns";

/**
 * Combines multiple style objects or arrays for React Native
 */
export function cn(...styles: any[]): any {
  return styles.filter(Boolean);
}

/**
 * Formats a date string to a readable format
 */
export function formatDate(date: string | Date, pattern = "PPP"): string {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, "p")}`;
  }

  if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, "p")}`;
  }

  return format(dateObj, pattern);
}

/**
 * Formats a number with comma separators
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait = 300
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters<T>): void {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Truncates a string to the specified length and adds an ellipsis
 */
export function truncate(str: string, length = 50): string {
  if (!str || str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

/**
 * Determines if the app is running on a web platform
 */
export function isWeb(): boolean {
  return Platform.OS === "web";
}

/**
 * Generates a random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
