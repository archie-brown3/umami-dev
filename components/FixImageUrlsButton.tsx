/**
 * Component to fix localhost image URLs in the database
 * This is a utility component for development/admin use
 */

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import {
  fixAllLocalhostImageUrls,
  previewLocalhostImageUrlFixes,
} from "../scripts/fix-localhost-image-urls";

export function FixImageUrlsButton() {
  const [isFixing, setIsFixing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      await previewLocalhostImageUrlFixes();
      Alert.alert("Preview Complete", "Check console for preview results");
    } catch (error) {
      Alert.alert(
        "Preview Failed",
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleFix = async () => {
    Alert.alert(
      "Fix Image URLs",
      "This will update all recipes with localhost image URLs. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Fix",
          style: "destructive",
          onPress: async () => {
            setIsFixing(true);
            try {
              const results = await fixAllLocalhostImageUrls();
              Alert.alert(
                "Fix Complete",
                `Fixed ${results.fixed} of ${results.total} recipes. ${results.failed} failed.`
              );
            } catch (error) {
              Alert.alert(
                "Fix Failed",
                error instanceof Error ? error.message : "Unknown error"
              );
            } finally {
              setIsFixing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Image URL Fixer</Text>
      <Text style={styles.description}>
        Fix recipes with localhost:3001 image URLs
      </Text>

      <TouchableOpacity
        style={[styles.button, styles.previewButton]}
        onPress={handlePreview}
        disabled={isPreviewing || isFixing}
      >
        <Text style={styles.buttonText}>
          {isPreviewing ? "Previewing..." : "Preview Fixes"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.fixButton]}
        onPress={handleFix}
        disabled={isFixing || isPreviewing}
      >
        <Text style={styles.buttonText}>
          {isFixing ? "Fixing..." : "Fix All URLs"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  button: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: "center",
  },
  previewButton: {
    backgroundColor: "#007AFF",
  },
  fixButton: {
    backgroundColor: "#FF3B30",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
});
