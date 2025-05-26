import { useState, useEffect, useCallback, useMemo } from "react";

interface UseImageLoadingOptions {
  componentName?: string;
  placeholderWidth?: number;
  placeholderHeight?: number;
  enableFallbacks?: boolean;
}

interface UseImageLoadingReturn {
  currentImageUrl: string | undefined;
  imageError: boolean;
  isLoading: boolean;
  handleImageError: () => void;
  handleImageLoad: () => void;
  getImageSource: () => { uri: string };
  resetImage: () => void;
}

/**
 * Custom hook for robust image loading with simple fallback
 * Simplified to prevent infinite loops and improve reliability
 */
export function useImageLoading(
  originalImageUrl: string | undefined,
  options: UseImageLoadingOptions = {}
): UseImageLoadingReturn {
  const {
    componentName = "ImageComponent",
    placeholderWidth = 400,
    placeholderHeight = 300,
  } = options;

  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reset state when URL changes
  useEffect(() => {
    setImageError(false);
    setIsLoading(!!originalImageUrl);
  }, [originalImageUrl]);

  const handleImageError = useCallback(() => {
    console.log(`[${componentName}] Image failed to load: ${originalImageUrl}`);
    setIsLoading(false);
    setImageError(true);
  }, [componentName, originalImageUrl]);

  const handleImageLoad = useCallback(() => {
    console.log(
      `[${componentName}] Image loaded successfully: ${originalImageUrl}`
    );
    setIsLoading(false);
    setImageError(false);
  }, [componentName, originalImageUrl]);

  const getImageSource = useCallback(() => {
    if (imageError || !originalImageUrl) {
      return {
        uri: `https://via.placeholder.com/${placeholderWidth}x${placeholderHeight}/EAEAEA/999999?text=No+Image`,
      };
    }

    return { uri: originalImageUrl };
  }, [imageError, originalImageUrl, placeholderWidth, placeholderHeight]);

  const resetImage = useCallback(() => {
    setImageError(false);
    setIsLoading(!!originalImageUrl);
    console.log(`[${componentName}] Image reset: ${originalImageUrl}`);
  }, [componentName, originalImageUrl]);

  return {
    currentImageUrl: originalImageUrl,
    imageError,
    isLoading,
    handleImageError,
    handleImageLoad,
    getImageSource,
    resetImage,
  };
}
