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

// Mock text recognition if module isn't available
async function extractTextFromImage(imageUri: string): Promise<string> {
  console.log(`Processing image for text extraction: ${imageUri}`);
  // This is a placeholder - in the actual app, this should be imported from services/textRecognition
  return "This is mock extracted text from the image. In production, this would be actual text extracted from the image using OCR.";
}

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
      const textPromises = capturedImages.map(async (uri, index) => {
        setProcessingStatus(
          `Processing image ${index + 1} of ${capturedImages.length}...`
        );
        return await extractTextFromImage(uri);
      });

      const extractedTexts = await Promise.all(textPromises);
      const combinedText = extractedTexts.join("\n\n");

      // Save to media library for debugging if needed
      for (const imageUri of capturedImages) {
        await MediaLibrary.saveToLibraryAsync(imageUri);
      }

      // Send the extracted text back
      onTextExtracted(combinedText);
    } catch (error) {
      console.error("Error processing images:", error);
      setProcessingStatus(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
      // Allow going back to preview
      setCurrentStep("preview");
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
          <Pressable
            style={styles.cameraButton}
            onPress={takePicture}
            disabled={!cameraReady}
          >
            <View style={styles.cameraButtonInner} />
          </Pressable>

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
              <Image source={{ uri: item }} style={styles.previewImage} />
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
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.processingText}>{processingStatus}</Text>
      <Text style={styles.processingSubtext}>This may take a moment...</Text>
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
  cameraButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
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
  processingText: {
    marginTop: spacing.lg,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  processingSubtext: {
    marginTop: spacing.md,
    color: colors.gray[600],
    textAlign: "center",
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
