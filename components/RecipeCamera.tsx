import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Image,
  ScrollView,
  Dimensions,
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as ImageManipulator from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "@/utils/styleUtils";
import {
  extractTextFromImage,
  validateExtractedText,
} from "@/services/textRecognition";

interface RecipeCameraProps {
  onTextExtracted: (text: string) => void;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export const RecipeCamera: React.FC<RecipeCameraProps> = ({
  onTextExtracted,
  onClose,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<
    "camera" | "preview" | "processing"
  >("camera");
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [cameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<any>(null);

  // Request camera permissions
  const ensurePermission = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      return granted;
    }
    return true;
  };

  // Handle capturing a photo
  const takePicture = async () => {
    if (!cameraReady || !cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync();

      // Optimize the image for text recognition
      const optimizedPhoto = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Add to captured images
      setCapturedImages((prev) => [...prev, optimizedPhoto.uri]);

      // If we have reached the maximum number of photos, go to preview
      if (capturedImages.length + 1 >= 2) {
        setCurrentStep("preview");
      }
    } catch (error) {
      console.error("Error taking picture:", error);
    }
  };

  // Process captured images for text extraction
  const processImages = async () => {
    if (capturedImages.length === 0) return;

    setCurrentStep("processing");
    setProcessingStatus("Extracting text from images...");

    try {
      // Extract text from each image and combine
      const extractedTexts: string[] = [];

      for (let i = 0; i < capturedImages.length; i++) {
        const imageUri = capturedImages[i];
        setProcessingStatus(
          `Processing image ${i + 1} of ${capturedImages.length}...`
        );

        console.log(`[RecipeCamera] Processing image ${i + 1}: ${imageUri}`);

        try {
          const extractedText = await extractTextFromImage(imageUri);

          if (extractedText && extractedText.trim().length > 0) {
            // Validate and clean the extracted text
            const validation = validateExtractedText(extractedText);

            if (validation.isValid) {
              extractedTexts.push(validation.cleanedText);
              console.log(
                `[RecipeCamera] Successfully extracted text from image ${i + 1}`
              );
            } else {
              console.warn(
                `[RecipeCamera] Text validation failed for image ${i + 1}:`,
                validation.issues
              );
              // Still include the text but with a warning
              extractedTexts.push(
                `[Note: Text quality may be low]\n${validation.cleanedText}`
              );
            }
          } else {
            console.warn(
              `[RecipeCamera] No text extracted from image ${i + 1}`
            );
            extractedTexts.push(`[No text detected in image ${i + 1}]`);
          }
        } catch (imageError) {
          console.error(
            `[RecipeCamera] Error processing image ${i + 1}:`,
            imageError
          );

          // Provide more specific error messages
          let errorMessage = "Unknown error";
          if (imageError instanceof Error) {
            if (imageError.message.includes("quota")) {
              errorMessage = "OCR service quota exceeded";
            } else if (imageError.message.includes("authentication")) {
              errorMessage = "OCR service authentication failed";
            } else if (imageError.message.includes("confidence too low")) {
              errorMessage = "Image quality too low for text extraction";
            } else {
              errorMessage = imageError.message;
            }
          }

          extractedTexts.push(
            `[Error processing image ${i + 1}: ${errorMessage}]`
          );
        }
      }

      // Combine all extracted texts
      const combinedText = extractedTexts
        .filter((text) => text.trim().length > 0)
        .join("\n\n--- Next Image ---\n\n");

      if (combinedText.trim().length === 0) {
        setProcessingStatus(
          "No text could be extracted from the images. Please try again with clearer photos or enter the recipe manually."
        );
        // Allow going back to preview after 3 seconds
        setTimeout(() => {
          setCurrentStep("preview");
        }, 3000);
        return;
      }

      // Save to media library for debugging if needed
      try {
        for (const imageUri of capturedImages) {
          await MediaLibrary.saveToLibraryAsync(imageUri);
        }
        console.log("[RecipeCamera] Images saved to media library");
      } catch (saveError) {
        console.warn(
          "[RecipeCamera] Could not save images to media library:",
          saveError
        );
        // This is not critical, so we continue
      }

      setProcessingStatus("Text extraction complete! Processing recipe...");

      // Send the extracted text back
      console.log(
        `[RecipeCamera] Sending extracted text (${combinedText.length} characters)`
      );
      onTextExtracted(combinedText);
    } catch (error) {
      console.error("[RecipeCamera] Error processing images:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setProcessingStatus(`Error: ${errorMessage}`);

      // Allow going back to preview after showing error
      setTimeout(() => {
        setCurrentStep("preview");
      }, 3000);
    }
  };

  // Function to remove an image from the captured images
  const removeImage = (index: number) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // If we don't have permission yet, render a request screen
  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          We need your permission to use the camera
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.white} />
        </Pressable>
      </View>
    );
  }

  // Render the camera view
  const renderCameraView = () => (
    <View style={styles.fullScreenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onCameraReady={() => setCameraReady(true)}
          ref={cameraRef}
        />

        {/* Camera UI Overlay */}
        <SafeAreaView style={styles.cameraOverlay}>
          <View style={styles.cameraHeader}>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={28} color={colors.white} />
            </Pressable>
            <Text style={styles.cameraTitleText}>
              Take a photo of your recipe
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Counter for images */}
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {capturedImages.length} of 2 photos
            </Text>
          </View>

          {/* Bottom controls */}
          <View style={styles.cameraControls}>
            <View style={styles.cameraButtonContainer}>
              <Pressable
                style={styles.cameraButton}
                onPress={takePicture}
                disabled={!cameraReady}
              >
                <View style={styles.cameraButtonInner} />
              </Pressable>
            </View>

            {capturedImages.length > 0 && (
              <Pressable
                style={styles.previewButton}
                onPress={() => setCurrentStep("preview")}
              >
                <Text style={styles.previewButtonText}>
                  Review ({capturedImages.length})
                </Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </View>
    </View>
  );

  // Render the preview screen
  const renderPreviewScreen = () => (
    <View style={styles.fullScreenContainer}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      <SafeAreaView style={styles.previewContainer}>
        <View style={styles.previewHeader}>
          <Pressable
            style={styles.backButton}
            onPress={() => setCurrentStep("camera")}
          >
            <Ionicons name="arrow-back" size={28} color={colors.white} />
          </Pressable>
          <Text style={styles.previewTitleText}>Review Photos</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Image gallery */}
        <FlatList
          data={capturedImages}
          keyExtractor={(item, index) => `${index}-${item}`}
          renderItem={({ item, index }) => (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item }}
                style={styles.previewImage}
                onError={() => {
                  console.log(
                    `[RecipeCamera] Failed to load captured image: ${item}`
                  );
                }}
                onLoad={() => {
                  console.log(
                    `[RecipeCamera] Successfully loaded captured image`
                  );
                }}
              />
              <Pressable
                style={styles.removeImageButton}
                onPress={() => removeImage(index)}
              >
                <Ionicons
                  name="close-circle"
                  size={32}
                  color={colors.primary}
                />
              </Pressable>
            </View>
          )}
          contentContainerStyle={styles.imageGallery}
        />

        {/* Add another photo button */}
        {capturedImages.length < 2 && (
          <Pressable
            style={styles.addPhotoButton}
            onPress={() => setCurrentStep("camera")}
          >
            <Ionicons name="add" size={24} color={colors.white} />
            <Text style={styles.addPhotoText}>Add another photo</Text>
          </Pressable>
        )}

        {/* Extract text button */}
        <Pressable
          style={[
            styles.extractButton,
            capturedImages.length === 0 && styles.disabledButton,
          ]}
          onPress={processImages}
          disabled={capturedImages.length === 0}
        >
          <Text style={styles.extractButtonText}>
            Extract Text ({capturedImages.length} photo
            {capturedImages.length !== 1 ? "s" : ""})
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );

  // Render processing screen
  const renderProcessingScreen = () => (
    <View style={styles.processingContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <SafeAreaView style={styles.processingContent}>
        {/* Header */}
        <View style={styles.processingHeader}>
          <Text style={styles.processingTitle}>Processing Images</Text>
          <Text style={styles.processingSubtitle}>
            Extracting text from your recipe photos...
          </Text>
        </View>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.processingText}>{processingStatus}</Text>
        </View>

        {/* Tips */}
        <View style={styles.tipsContainer}>
          <Ionicons name="bulb-outline" size={20} color={colors.gray[500]} />
          <Text style={styles.tipsText}>
            For best results, ensure your photos have good lighting and clear
            text. This process may take a few moments.
          </Text>
        </View>

        {/* Progress bar simulation */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "70%" }]} />
          </View>
          <Text style={styles.progressText}>Processing...</Text>
        </View>
      </SafeAreaView>
    </View>
  );

  // Render the appropriate screen based on current step
  switch (currentStep) {
    case "camera":
      return renderCameraView();
    case "preview":
      return renderPreviewScreen();
    case "processing":
      return renderProcessingScreen();
    default:
      return renderCameraView();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreenContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "black",
  },
  cameraContainer: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  camera: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "column",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  cameraHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingTop: spacing.lg,
  },
  cameraTitleText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  cameraControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: spacing.xl,
  },
  cameraButtonContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.white,
  },
  cameraButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.white,
  },
  previewButton: {
    position: "absolute",
    right: spacing.xl,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  previewButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
  previewContainer: {
    flex: 1,
    backgroundColor: "#111",
    padding: spacing.md,
  },
  previewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
    paddingTop: spacing.lg,
  },
  previewTitleText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  imageGallery: {
    paddingBottom: spacing.lg,
  },
  imageContainer: {
    marginBottom: spacing.md,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: 300,
    resizeMode: "cover",
  },
  removeImageButton: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 16,
  },
  addPhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.gray[700],
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.lg,
  },
  addPhotoText: {
    color: colors.white,
    marginLeft: spacing.sm,
    fontWeight: "600",
  },
  extractButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
  },
  extractButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: colors.gray[500],
  },
  counterContainer: {
    position: "absolute",
    top: 100,
    right: 0,
    left: 0,
    alignItems: "center",
  },
  counterText: {
    color: colors.white,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    overflow: "hidden",
  },
  processingContainer: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  processingContent: {
    flex: 1,
    padding: spacing.md,
  },
  processingHeader: {
    marginBottom: spacing.lg,
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  processingSubtitle: {
    color: colors.gray[600],
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  processingText: {
    marginLeft: spacing.md,
    fontSize: 16,
    fontWeight: "bold",
  },
  tipsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  tipsText: {
    marginLeft: spacing.md,
    color: colors.gray[500],
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 20,
    backgroundColor: colors.gray[200],
    borderRadius: 10,
    overflow: "hidden",
    marginRight: spacing.md,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
  },
  progressText: {
    color: colors.gray[500],
  },
  permissionText: {
    marginBottom: spacing.lg,
    fontSize: 16,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: colors.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  backButton: {
    padding: spacing.sm,
  },
});
