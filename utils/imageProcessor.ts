/**
 * Unified Image Processing Utility
 * Consolidates all image URL processing logic for consistency
 * Following rules.md: Abstract reusable logic into utility functions
 */

import { API_ENDPOINTS } from "../constants/api";

export interface ImageProcessingOptions {
  forceProxy?: boolean;
  preferredSize?: { width: number; height: number };
  fallbackToExternal?: boolean;
  enableFallbackStrategies?: boolean;
  retryCount?: number;
}

/**
 * Process any image URL with appropriate proxy handling
 * Single source of truth for all image URL processing
 */
export function processImageUrl(
  imageUrl: string | undefined,
  options: ImageProcessingOptions = {}
): string | undefined {
  if (!imageUrl || typeof imageUrl !== "string") {
    return undefined;
  }

  console.log(`[ImageProcessor] Processing image URL: ${imageUrl}`);

  // CRITICAL FIX: Handle localhost URLs from database
  if (imageUrl.includes("localhost:3001/api/image-proxy")) {
    console.log(
      `[ImageProcessor] Detected localhost proxy URL, extracting original`
    );
    try {
      const url = new URL(imageUrl);
      const originalUrl = decodeURIComponent(url.searchParams.get("url") || "");
      if (originalUrl) {
        console.log(`[ImageProcessor] Extracted original URL: ${originalUrl}`);
        // Process the original URL with proper proxy
        return processImageUrl(originalUrl, options);
      }
    } catch (error) {
      console.warn(
        `[ImageProcessor] Failed to extract original URL from localhost proxy:`,
        error
      );
    }
  }

  // Check if already proxied - avoid double-proxying
  if (isAlreadyProxied(imageUrl)) {
    console.log(`[ImageProcessor] Image already proxied, returning as-is`);
    return imageUrl;
  }

  // Check if this is an Instagram CDN URL that needs proxying
  if (needsInstagramProxy(imageUrl) || options.forceProxy) {
    return applyImageProxyWithFallbacks(imageUrl, options);
  }

  // For other URLs, return as-is unless specifically requested to proxy
  console.log(`[ImageProcessor] No proxy needed for URL: ${imageUrl}`);
  return imageUrl;
}

/**
 * Check if an image URL is already using a proxy service
 */
function isAlreadyProxied(imageUrl: string): boolean {
  const proxyIndicators = [
    "images.weserv.nl",
    "wsrv.nl",
    "image-proxy",
    "imageproxy",
    "proxy",
    "recipeextractionservice.onrender.com/api/image-proxy",
  ];

  return proxyIndicators.some((indicator) =>
    imageUrl.toLowerCase().includes(indicator)
  );
}

/**
 * Check if an image URL needs Instagram proxy
 */
function needsInstagramProxy(imageUrl: string): boolean {
  const instagramDomains = [
    "cdninstagram.com",
    "fbcdn.net",
    "instagram.com",
    "scontent-",
    "instagram.fltn",
    "instagram.fna",
  ];

  return instagramDomains.some((domain) => imageUrl.includes(domain));
}

/**
 * Apply appropriate proxy to an image URL with multiple fallback strategies
 * Enhanced for Instagram CDN reliability
 */
function applyImageProxyWithFallbacks(
  imageUrl: string,
  options: ImageProcessingOptions
): string {
  console.log(`[ImageProcessor] Applying proxy to: ${imageUrl}`);

  // For Instagram URLs, prefer external proxy first due to reliability issues
  if (needsInstagramProxy(imageUrl)) {
    console.log(
      `[ImageProcessor] Instagram URL detected, using external proxy first`
    );

    // Strategy 1: External proxy service (primary for Instagram)
    if (options.fallbackToExternal !== false) {
      try {
        const sizeParams = options.preferredSize
          ? `&w=${options.preferredSize.width}&h=${options.preferredSize.height}&fit=cover`
          : "&w=640&h=640&fit=cover";

        const externalProxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(
          imageUrl
        )}${sizeParams}&output=jpg&il`;
        console.log(
          `[ImageProcessor] Generated external proxy URL: ${externalProxyUrl}`
        );
        return externalProxyUrl;
      } catch (error) {
        console.warn(
          `[ImageProcessor] Failed to generate external proxy URL:`,
          error
        );
      }
    }

    // Strategy 2: Local image proxy endpoint (fallback for Instagram)
    try {
      const extractionServiceUrl =
        API_ENDPOINTS.EXTRACT_API_URL ||
        API_ENDPOINTS.RECIPE_EXTRACTION_SERVICE_URL;

      if (extractionServiceUrl) {
        const localProxyUrl = `${extractionServiceUrl}/api/image-proxy?url=${encodeURIComponent(
          imageUrl
        )}`;
        console.log(
          `[ImageProcessor] Generated local proxy URL as fallback: ${localProxyUrl}`
        );
        return localProxyUrl;
      }
    } catch (error) {
      console.warn(
        `[ImageProcessor] Failed to generate local proxy URL:`,
        error
      );
    }
  } else {
    // For non-Instagram URLs, prefer local proxy first
    // Strategy 1: Local image proxy endpoint (primary)
    try {
      const extractionServiceUrl =
        API_ENDPOINTS.EXTRACT_API_URL ||
        API_ENDPOINTS.RECIPE_EXTRACTION_SERVICE_URL;

      if (extractionServiceUrl) {
        const localProxyUrl = `${extractionServiceUrl}/api/image-proxy?url=${encodeURIComponent(
          imageUrl
        )}`;
        console.log(
          `[ImageProcessor] Generated local proxy URL: ${localProxyUrl}`
        );
        return localProxyUrl;
      }
    } catch (error) {
      console.warn(
        `[ImageProcessor] Failed to generate local proxy URL:`,
        error
      );
    }

    // Strategy 2: External proxy service (fallback)
    if (options.fallbackToExternal !== false) {
      try {
        const sizeParams = options.preferredSize
          ? `&w=${options.preferredSize.width}&h=${options.preferredSize.height}&fit=cover`
          : "&w=640&h=640&fit=cover";

        const externalProxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(
          imageUrl
        )}${sizeParams}&output=jpg`;
        console.log(
          `[ImageProcessor] Generated external proxy URL: ${externalProxyUrl}`
        );
        return externalProxyUrl;
      } catch (error) {
        console.warn(
          `[ImageProcessor] Failed to generate external proxy URL:`,
          error
        );
      }
    }
  }

  // Strategy 3: Return original URL as fallback
  console.log(`[ImageProcessor] Using original URL as fallback: ${imageUrl}`);
  return imageUrl;
}

/**
 * Apply appropriate proxy to an image URL (legacy function for compatibility)
 */
function applyImageProxy(
  imageUrl: string,
  options: ImageProcessingOptions
): string {
  return applyImageProxyWithFallbacks(imageUrl, options);
}

/**
 * Generate multiple fallback URLs for an image
 */
export function generateImageFallbacks(
  imageUrl: string,
  options: ImageProcessingOptions = {}
): string[] {
  if (!imageUrl) return [];

  const fallbacks: string[] = [];
  const sizeParams = options.preferredSize
    ? `&w=${options.preferredSize.width}&h=${options.preferredSize.height}&fit=cover`
    : "&w=640&h=640&fit=cover";

  // Strategy 1: Local proxy
  try {
    const extractionServiceUrl =
      API_ENDPOINTS.EXTRACT_API_URL ||
      API_ENDPOINTS.RECIPE_EXTRACTION_SERVICE_URL;

    if (extractionServiceUrl) {
      fallbacks.push(
        `${extractionServiceUrl}/api/image-proxy?url=${encodeURIComponent(
          imageUrl
        )}`
      );
    }
  } catch (error) {
    console.warn(
      `[ImageProcessor] Failed to generate local proxy fallback:`,
      error
    );
  }

  // Strategy 2: External proxy (weserv.nl)
  try {
    fallbacks.push(
      `https://images.weserv.nl/?url=${encodeURIComponent(
        imageUrl
      )}${sizeParams}&output=jpg`
    );
  } catch (error) {
    console.warn(`[ImageProcessor] Failed to generate weserv fallback:`, error);
  }

  // Strategy 3: Alternative external proxy (wsrv.nl)
  try {
    fallbacks.push(
      `https://wsrv.nl/?url=${encodeURIComponent(
        imageUrl
      )}${sizeParams}&output=jpg`
    );
  } catch (error) {
    console.warn(`[ImageProcessor] Failed to generate wsrv fallback:`, error);
  }

  // Strategy 4: Original URL
  if (!isAlreadyProxied(imageUrl)) {
    fallbacks.push(imageUrl);
  }

  console.log(
    `[ImageProcessor] Generated ${fallbacks.length} fallback URLs for: ${imageUrl}`
  );
  return fallbacks;
}

/**
 * Process Instagram-specific image URLs with enhanced handling
 * Includes retry logic and multiple fallback strategies for Instagram CDN reliability
 */
export function processInstagramImageUrl(
  imageUrl: string | undefined,
  options: ImageProcessingOptions = {}
): string | undefined {
  if (!imageUrl) return undefined;

  console.log(`[ImageProcessor] Processing Instagram image: ${imageUrl}`);

  // Enhanced options for Instagram URLs
  const instagramOptions: ImageProcessingOptions = {
    ...options,
    forceProxy: true,
    fallbackToExternal: true,
    enableFallbackStrategies: true,
    preferredSize: options.preferredSize || { width: 640, height: 640 },
  };

  // For Instagram URLs, always use external proxy first due to reliability issues
  if (needsInstagramProxy(imageUrl)) {
    console.log(
      `[ImageProcessor] Instagram CDN URL detected, using optimized strategy`
    );

    try {
      // Primary strategy: Use weserv.nl with Instagram-optimized parameters
      const sizeParams = instagramOptions.preferredSize
        ? `&w=${instagramOptions.preferredSize.width}&h=${instagramOptions.preferredSize.height}&fit=cover`
        : "&w=640&h=640&fit=cover";

      // Add Instagram-specific parameters for better reliability
      const instagramProxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(
        imageUrl
      )}${sizeParams}&output=jpg&il&af&we`;

      console.log(
        `[ImageProcessor] Generated Instagram-optimized proxy URL: ${instagramProxyUrl}`
      );
      return instagramProxyUrl;
    } catch (error) {
      console.warn(
        `[ImageProcessor] Failed to generate Instagram proxy URL:`,
        error
      );
    }
  }

  // Fallback to standard processing
  return processImageUrl(imageUrl, instagramOptions);
}

/**
 * Generate Instagram-specific fallback URLs with enhanced strategies
 */
export function generateInstagramImageFallbacks(
  imageUrl: string,
  options: ImageProcessingOptions = {}
): string[] {
  if (!imageUrl) return [];

  const fallbacks: string[] = [];
  const sizeParams = options.preferredSize
    ? `&w=${options.preferredSize.width}&h=${options.preferredSize.height}&fit=cover`
    : "&w=640&h=640&fit=cover";

  console.log(
    `[ImageProcessor] Generating Instagram fallbacks for: ${imageUrl}`
  );

  // Strategy 1: weserv.nl with Instagram-optimized parameters
  try {
    fallbacks.push(
      `https://images.weserv.nl/?url=${encodeURIComponent(
        imageUrl
      )}${sizeParams}&output=jpg&il&af&we`
    );
  } catch (error) {
    console.warn(
      `[ImageProcessor] Failed to generate weserv Instagram fallback:`,
      error
    );
  }

  // Strategy 2: weserv.nl with basic parameters
  try {
    fallbacks.push(
      `https://images.weserv.nl/?url=${encodeURIComponent(
        imageUrl
      )}${sizeParams}&output=jpg`
    );
  } catch (error) {
    console.warn(
      `[ImageProcessor] Failed to generate basic weserv fallback:`,
      error
    );
  }

  // Strategy 3: Local proxy (if available)
  try {
    const extractionServiceUrl =
      API_ENDPOINTS.EXTRACT_API_URL ||
      API_ENDPOINTS.RECIPE_EXTRACTION_SERVICE_URL;

    if (extractionServiceUrl) {
      fallbacks.push(
        `${extractionServiceUrl}/api/image-proxy?url=${encodeURIComponent(
          imageUrl
        )}`
      );
    }
  } catch (error) {
    console.warn(
      `[ImageProcessor] Failed to generate local proxy fallback:`,
      error
    );
  }

  // Strategy 4: Alternative external proxy
  try {
    fallbacks.push(
      `https://wsrv.nl/?url=${encodeURIComponent(
        imageUrl
      )}${sizeParams}&output=jpg`
    );
  } catch (error) {
    console.warn(`[ImageProcessor] Failed to generate wsrv fallback:`, error);
  }

  // Strategy 5: Original URL (last resort)
  if (!isAlreadyProxied(imageUrl)) {
    fallbacks.push(imageUrl);
  }

  console.log(
    `[ImageProcessor] Generated ${fallbacks.length} Instagram fallback URLs`
  );
  return fallbacks;
}

/**
 * Process recipe image URLs with enhanced handling
 */
export function processRecipeImageUrl(
  imageUrl: string | undefined,
  options: ImageProcessingOptions = {}
): string | undefined {
  if (!imageUrl) return undefined;

  console.log(`[ImageProcessor] Processing recipe image: ${imageUrl}`);

  // Check if it's an Instagram URL that needs special handling
  if (needsInstagramProxy(imageUrl)) {
    return processInstagramImageUrl(imageUrl, options);
  }

  // For other recipe images, use standard processing
  return processImageUrl(imageUrl, options);
}

/**
 * Extract original URL from a proxy URL
 */
export function extractOriginalUrl(proxyUrl: string): string | null {
  try {
    const url = new URL(proxyUrl);

    // Handle different proxy URL formats
    const urlParam = url.searchParams.get("url");
    if (urlParam) {
      return decodeURIComponent(urlParam);
    }

    // Handle weserv.nl format
    if (
      url.hostname.includes("weserv.nl") ||
      url.hostname.includes("wsrv.nl")
    ) {
      const urlParam = url.searchParams.get("url");
      if (urlParam) {
        return decodeURIComponent(urlParam);
      }
    }

    return null;
  } catch (error) {
    console.warn(
      `[ImageProcessor] Failed to extract original URL from: ${proxyUrl}`,
      error
    );
    return null;
  }
}

/**
 * Validate if an image URL is accessible
 */
export async function validateImageUrl(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl, { method: "HEAD" });
    return response.ok;
  } catch (error) {
    console.warn(
      `[ImageProcessor] Image validation failed for: ${imageUrl}`,
      error
    );
    return false;
  }
}

/**
 * Get the best working image URL from fallbacks
 */
export async function getBestImageUrl(
  imageUrl: string,
  options: ImageProcessingOptions = {}
): Promise<string | undefined> {
  if (!imageUrl) return undefined;

  const fallbacks = generateImageFallbacks(imageUrl, options);

  for (const fallbackUrl of fallbacks) {
    try {
      const isValid = await validateImageUrl(fallbackUrl);
      if (isValid) {
        console.log(`[ImageProcessor] Found working image URL: ${fallbackUrl}`);
        return fallbackUrl;
      }
    } catch (error) {
      console.warn(
        `[ImageProcessor] Failed to validate: ${fallbackUrl}`,
        error
      );
      continue;
    }
  }

  console.warn(`[ImageProcessor] No working image URL found for: ${imageUrl}`);
  return fallbacks[0]; // Return first fallback as last resort
}

/**
 * Validate if an image URL is usable
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;

  // Check for valid image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i;
  if (imageExtensions.test(url)) return true;

  // Check for data URLs
  if (url.startsWith("data:image/")) return true;

  // Check for URLs that might be images (common patterns)
  if (url.includes("image") || url.includes("photo") || url.includes("picture"))
    return true;

  // Reject obvious non-images
  const nonImagePatterns = [
    /\.(js|css|html|xml|json|txt|pdf|doc)(\?|$)/i,
    /javascript:/i,
    /mailto:/i,
    /tel:/i,
  ];

  return !nonImagePatterns.some((pattern) => pattern.test(url));
}

/**
 * Get fallback image URL for failed loads
 */
export function getFallbackImageUrl(): string {
  // Return a placeholder or default recipe image
  return "https://via.placeholder.com/640x640/f0f0f0/666666?text=Recipe+Image";
}

/**
 * Batch process multiple image URLs
 */
export function processImageUrls(
  imageUrls: (string | undefined)[],
  options: ImageProcessingOptions = {}
): (string | undefined)[] {
  return imageUrls.map((url) => processImageUrl(url, options));
}
