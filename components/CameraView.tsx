import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Text, Pressable, Alert } from "react-native";
import { Camera, CameraType } from "expo-camera";
import * as MediaLibrary from "expo-media-library";
import * as ImageManipulator from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/styleUtils";

interface CameraViewProps {
  onCapture: (imageUri: string) => void;
  onClose: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onCapture,
  onClose,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [type, setType] = useState(CameraType.back);
  const cameraRef = useRef<Camera | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const mediaStatus = await MediaLibrary.requestPermissionsAsync();
      setHasPermission(
        status === "granted" && mediaStatus.status === "granted"
      );
    })();
  }, []);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: false,
      });

      // Optimize the image
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [
          { resize: { width: 1080 } }, // Resize to reasonable dimensions
        ],
        {
          compress: 0.8, // Compress with good quality
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      // Save to media library
      await MediaLibrary.saveToLibraryAsync(manipulatedImage.uri);

      // Pass the image URI back to parent
      onCapture(manipulatedImage.uri);
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to take picture. Please try again.");
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera ref={cameraRef} style={styles.camera} type={type}>
        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.flipButton}
            onPress={() =>
              setType(
                type === CameraType.back ? CameraType.front : CameraType.back
              )
            }
          >
            <Ionicons name="camera-reverse-outline" size={24} color="white" />
          </Pressable>

          <Pressable style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureInner} />
          </Pressable>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-outline" size={24} color="white" />
          </Pressable>
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    width: "100%",
    padding: 20,
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  flipButton: {
    padding: 15,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  closeButton: {
    padding: 15,
  },
});
