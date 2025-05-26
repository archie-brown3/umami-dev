import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  createShadow,
} from "@/utils/styleUtils";

interface ImageEditSectionProps {
  imageUrl?: string;
  onImageChange: (imageUrl: string | undefined) => void;
  error?: string;
}

const ImageEditSection: React.FC<ImageEditSectionProps> = ({
  imageUrl,
  onImageChange,
  error,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Sorry, we need camera roll permissions to upload images."
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Sorry, we need camera permissions to take photos."
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const uploadImage = async (uri: string) => {
    setIsUploading(true);
    try {
      // For now, we'll just use the local URI
      // In a real app, you'd upload to your storage service (Supabase, AWS S3, etc.)

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // TODO: Implement actual image upload to your storage service
      // const uploadedUrl = await uploadToStorage(uri);

      onImageChange(uri);
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    Alert.alert("Remove Image", "Are you sure you want to remove this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => onImageChange(undefined),
      },
    ]);
  };

  const showImageOptions = () => {
    Alert.alert(
      "Add Photo",
      "Choose how you'd like to add a photo to your recipe",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Library", onPress: pickImage },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Recipe Photo</Text>

      {imageUrl ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl }} style={styles.image} />

          {/* Image overlay with actions */}
          <View style={styles.imageOverlay}>
            <TouchableOpacity
              style={styles.overlayButton}
              onPress={showImageOptions}
              disabled={isUploading}
            >
              <Ionicons name="camera" size={20} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.overlayButton, styles.removeButton]}
              onPress={removeImage}
              disabled={isUploading}
            >
              <Ionicons name="trash" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>

          {isUploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color={colors.white} />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={styles.uploadArea}
          onPress={showImageOptions}
          disabled={isUploading}
        >
          {isUploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          ) : (
            <>
              <Ionicons
                name="camera-outline"
                size={48}
                color={colors.gray[400]}
              />
              <Text style={styles.uploadText}>Add Recipe Photo</Text>
              <Text style={styles.uploadSubtext}>
                Tap to take a photo or choose from library
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Ionicons name="bulb-outline" size={16} color={colors.gray[500]} />
        <Text style={styles.tipsText}>
          Good photos make recipes more appealing! Try to capture the finished
          dish in good lighting.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    ...createShadow(2, 0.1, 8),
  },
  cardTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: spacing.md,
  },
  imageContainer: {
    position: "relative",
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: borderRadius.lg,
  },
  imageOverlay: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    flexDirection: "row",
  },
  overlayButton: {
    backgroundColor: colors.black + "80",
    borderRadius: 20,
    padding: spacing.sm,
    marginLeft: spacing.xs,
  },
  removeButton: {
    backgroundColor: colors.red[500] + "80",
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.black + "50",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: "dashed",
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
    marginBottom: spacing.sm,
  },
  uploadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: {
    fontSize: typography.fontSizes.lg,
    fontWeight: "600",
    color: colors.gray[600],
    marginTop: spacing.md,
    textAlign: "center",
  },
  uploadSubtext: {
    fontSize: typography.fontSizes.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
    textAlign: "center",
  },
  uploadingText: {
    fontSize: typography.fontSizes.md,
    color: colors.white,
    marginTop: spacing.sm,
    fontWeight: "600",
  },
  errorText: {
    fontSize: typography.fontSizes.sm,
    color: colors.red[500],
    marginTop: spacing.sm,
  },
  tipsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.blue[50],
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  tipsText: {
    fontSize: typography.fontSizes.xs,
    color: colors.gray[600],
    marginLeft: spacing.xs,
    flex: 1,
    lineHeight: 16,
  },
});

export default ImageEditSection;
