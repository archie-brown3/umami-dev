/**
 * Image loading utilities for handling various image sources
 * Includes special handling for Instagram CDN URLs and proxy services
 */

import { API_ENDPOINTS } from "../constants/api";
import { processImageUrl as unifiedProcessImageUrl } from "./imageProcessor";

export interface ImageLoadingState {
  currentUrl: string | undefined;
  hasError: boolean;
  isLoading: boolean;
}

export interface ImageFallbackStrategy {
  url: string;
  description: string;
}

/**
 * Process image URL using the unified image processor
 * @deprecated Use processImageUrl from imageProcessor.ts directly
 */
export function processImageUrl(
  imageUrl: string | undefined
): string | undefined {
  return unifiedProcessImageUrl(imageUrl);
}

/**
 * Create a local proxy URL for Instagram CDN images (primary method)
 */
export function createLocalProxyUrl(originalUrl: string): string {
  try {
    const localProxyUrl = `${
      API_ENDPOINTS.EXTRACT_API_URL
    }/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
    console.log(`[ImageUtils] Created local proxy URL: ${localProxyUrl}`);
    return localProxyUrl;
  } catch (error) {
    console.warn(
      `[ImageUtils] Failed to create local proxy URL, using external proxy: ${error}`
    );
    return createExternalProxyUrl(originalUrl);
  }
}

/**
 * Create a proxy URL for Instagram CDN images using external service (fallback)
 */
export function createExternalProxyUrl(originalUrl: string): string {
  try {
    const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(
      originalUrl
    )}&w=640&h=640&fit=cover&output=jpg`;
    console.log(`[ImageUtils] Created external proxy URL: ${proxyUrl}`);
    return proxyUrl;
  } catch (error) {
    console.warn(`[ImageUtils] Failed to create external proxy URL: ${error}`);
    return originalUrl;
  }
}

/**
 * Create alternative proxy URL using different service
 */
export function createAlternativeProxyUrl(originalUrl: string): string {
  try {
    const proxyUrl = `https://wsrv.nl/?url=${encodeURIComponent(
      originalUrl
    )}&w=640&h=640&fit=cover&output=jpg`;
    console.log(`[ImageUtils] Created alternative proxy URL: ${proxyUrl}`);
    return proxyUrl;
  } catch (error) {
    console.warn(
      `[ImageUtils] Failed to create alternative proxy URL: ${error}`
    );
    return originalUrl;
  }
}

/**
 * Extract original URL from proxy URL
 */
export function extractOriginalUrl(proxyUrl: string): string | null {
  try {
    const url = new URL(proxyUrl);
    const originalUrl = decodeURIComponent(url.searchParams.get("url") || "");
    return originalUrl || null;
  } catch (error) {
    console.warn(`[ImageUtils] Failed to extract original URL: ${error}`);
    return null;
  }
}

/**
 * Generate fallback strategies for image loading
 */
export function generateFallbackStrategies(
  originalImageUrl: string
): ImageFallbackStrategy[] {
  const strategies: ImageFallbackStrategy[] = [];

  if (!originalImageUrl) return strategies;

  // Strategy 1: Try local proxy for Instagram CDN URLs
  if (
    (originalImageUrl.includes("cdninstagram.com") ||
      originalImageUrl.includes("fbcdn.net")) &&
    !originalImageUrl.includes("image-proxy")
  ) {
    strategies.push({
      url: createLocalProxyUrl(originalImageUrl),
      description: "Local image proxy service",
    });
  }

  // Strategy 2: Try external proxy for Instagram CDN URLs
  if (
    (originalImageUrl.includes("cdninstagram.com") ||
      originalImageUrl.includes("fbcdn.net")) &&
    !originalImageUrl.includes("weserv.nl")
  ) {
    strategies.push({
      url: createExternalProxyUrl(originalImageUrl),
      description: "External proxy service",
    });
  }

  // Strategy 3: Try alternative proxy if currently using primary
  if (originalImageUrl.includes("images.weserv.nl")) {
    const alternativeUrl = originalImageUrl.replace(
      "images.weserv.nl",
      "wsrv.nl"
    );
    strategies.push({
      url: alternativeUrl,
      description: "Alternative proxy service",
    });
  }

  // Strategy 4: Try to extract and use original URL if using proxy
  if (
    originalImageUrl.includes("weserv.nl") ||
    originalImageUrl.includes("wsrv.nl") ||
    originalImageUrl.includes("image-proxy")
  ) {
    const originalUrl = extractOriginalUrl(originalImageUrl);
    if (originalUrl) {
      strategies.push({
        url: originalUrl,
        description: "Original URL (direct access)",
      });
    }
  }

  // Strategy 5: Try original URL if not already tried
  if (!strategies.some((s) => s.url === originalImageUrl)) {
    strategies.push({
      url: originalImageUrl,
      description: "Original URL",
    });
  }

  return strategies;
}

/**
 * Get placeholder image URL
 */
export function getPlaceholderImageUrl(
  width: number = 400,
  height: number = 300
): string {
  return `https://via.placeholder.com/${width}x${height}/EAEAEA/999999?text=No+Image`;
}

/**
 * Check if URL is using a proxy service
 */
export function isProxyUrl(url: string): boolean {
  return (
    url.includes("images.weserv.nl") ||
    url.includes("wsrv.nl") ||
    url.includes("image-proxy")
  );
}

/**
 * Log image loading event for debugging
 */
export function logImageEvent(
  component: string,
  event: string,
  url?: string,
  error?: any
): void {
  const message = `[${component}] ${event}${url ? `: ${url}` : ""}`;

  if (error) {
    console.error(message, error);
  } else {
    console.log(message);
  }
}
