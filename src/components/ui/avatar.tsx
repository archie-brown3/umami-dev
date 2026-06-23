import React, { useState } from "react";
import { View, Image, Text, StyleSheet } from "react-native";

interface AvatarProps {
  children: React.ReactNode;
  style?: any;
}

export function Avatar({ children, style }: AvatarProps) {
  return <View style={[styles.avatar, style]}>{children}</View>;
}

interface AvatarImageProps {
  src?: string;
  style?: any;
}

export function AvatarImage({ src, style }: AvatarImageProps) {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) return null;

  return (
    <Image
      source={{ uri: src }}
      style={[styles.image, style]}
      onError={() => {
        console.log(`[AvatarImage] Image failed to load: ${src}`);
        setImageError(true);
      }}
      onLoad={() => {
        console.log(`[AvatarImage] Image loaded successfully: ${src}`);
      }}
    />
  );
}

interface AvatarFallbackProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
}

export function AvatarFallback({
  children,
  className,
  style,
}: AvatarFallbackProps) {
  return (
    <View style={[styles.fallback, style]}>
      <Text style={styles.fallbackText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  fallback: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4ade80", // Default green
  },
  fallbackText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
