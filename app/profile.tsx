import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRecipes } from "@/context/RecipeContext";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { useSubscription } from "@/context/SubscriptionContext";
import { Paywall } from "@/components/subscription/Paywall";
import { router, Stack } from "expo-router";
import { colors, spacing, borderRadius, typography } from "@/utils/styleUtils";
import * as ImagePicker from "expo-image-picker";
import { demoUser, demoRecipes } from "@/lib/demoData";

interface UserStats {
  totalRecipes: number;
  favoriteRecipes: number;
  recentlyAdded: number;
  joinedDate: string;
}

export default function ProfileScreen() {
  const { recipes } = useRecipes();
  const { isPremium, presentPaywall } = useSubscription();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  const user = demoUser;

  useEffect(() => {
    loadUserStats();
  }, [recipes]);

  const loadUserStats = async () => {
    setIsLoading(true);
    try {
      const allRecipes = recipes.length > 0 ? recipes : demoRecipes;
      const totalRecipes = allRecipes.length;
      const favoriteRecipes = allRecipes.filter((r) => r.isFavorite).length;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentlyAdded =
        allRecipes.filter((r) => new Date(r.createdAt) > oneWeekAgo).length || 0;

      setUserStats({
        totalRecipes,
        favoriteRecipes,
        recentlyAdded,
        joinedDate: demoUser.created_at,
      });
    } catch (error) {
      console.error("[Profile] Error loading user stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const handlePhotoUpload = async () => {
    Alert.alert(
      "Update Profile Photo",
      "Choose how you'd like to update your profile photo",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: () => takePicture() },
        { text: "Choose from Library", onPress: () => pickImage() },
        ...(avatarUrl
          ? [
              {
                text: "Remove Photo",
                onPress: () => removePhoto(),
                style: "destructive" as const,
              },
            ]
          : []),
      ]
    );
  };

  const takePicture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Camera permission is required to take photos."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Photo library permission is required to select photos."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select photo. Please try again.");
    }
  };

  const uploadPhoto = async (uri: string) => {
    setIsUploadingPhoto(true);
    try {
      setAvatarUrl(uri);
      Alert.alert("Success", "Profile photo updated successfully!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      Alert.alert("Error", "Failed to upload photo. Please try again.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const removePhoto = async () => {
    try {
      setAvatarUrl(null);
      Alert.alert("Success", "Profile photo removed successfully!");
    } catch (error) {
      console.error("Error removing photo:", error);
      Alert.alert("Error", "Failed to remove photo. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerActions}>
          <View style={styles.actionButton} />
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              style={styles.avatar}
              onPress={handlePhotoUpload}
              disabled={isUploadingPhoto}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>
                  {user.email?.substring(0, 2).toUpperCase() || "US"}
                </Text>
              )}
              {isUploadingPhoto && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color={colors.white} />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={handlePhotoUpload}
              disabled={isUploadingPhoto}
            >
              <Ionicons name="camera" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user.user_metadata?.full_name ||
                user.email?.split("@")[0] ||
                "Recipe Chef"}
            </Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.joinDate}>
              Member since{" "}
              {formatJoinDate(userStats?.joinedDate || user.created_at)}
            </Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.statsLoadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading statistics...</Text>
          </View>
        ) : (
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>📊 Your Recipe Stats</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {userStats?.totalRecipes || 0}
                </Text>
                <Text style={styles.statLabel}>Total Recipes</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {userStats?.favoriteRecipes || 0}
                </Text>
                <Text style={styles.statLabel}>Favorites</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {userStats?.recentlyAdded || 0}
                </Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.subscriptionSection}>
          <Text style={styles.sectionTitle}>⭐ Subscription Status</Text>
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <View style={styles.subscriptionInfo}>
                <View style={styles.subscriptionStatus}>
                  <View
                    style={[
                      styles.statusIndicator,
                      {
                        backgroundColor: isPremium
                          ? colors.green[500]
                          : colors.orange[500],
                      },
                    ]}
                  />
                  <Text style={styles.subscriptionTitle}>
                    {isPremium ? "Premium Member" : "Free Plan"}
                  </Text>
                </View>
                <Text style={styles.subscriptionSubtitle}>
                  {isPremium
                    ? "Enjoy unlimited access to all features"
                    : "Upgrade to unlock premium features"}
                </Text>
              </View>
              <Ionicons
                name={isPremium ? "star" : "star-outline"}
                size={28}
                color={colors.orange[500]}
              />
            </View>

            {isPremium ? (
              <View style={styles.premiumFeatures}>
                <Text style={styles.featuresTitle}>
                  Active Premium Features:
                </Text>
                <View style={styles.featuresList}>
                  <View style={styles.featureItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.green[500]}
                    />
                    <Text style={styles.featureText}>Unlimited recipes</Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.green[500]}
                    />
                    <Text style={styles.featureText}>
                      Advanced meal planning (12 weeks)
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.green[500]}
                    />
                    <Text style={styles.featureText}>
                      Text recognition from photos
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.green[500]}
                    />
                    <Text style={styles.featureText}>
                      Cloud sync & PDF export
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.manageSubscriptionButton}
                  onPress={() => {
                    Alert.alert(
                      "Manage Subscription",
                      "To manage your subscription, please go to your App Store account settings.",
                      [{ text: "OK" }]
                    );
                  }}
                >
                  <Text style={styles.manageSubscriptionText}>
                    Manage Subscription
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.upgradeSection}>
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={() => presentPaywall("premium_access")}
                >
                  <Ionicons name="star" size={20} color={colors.white} />
                  <Text style={styles.upgradeButtonText}>
                    Upgrade to Premium
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={styles.accountSection}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={() =>
              Alert.alert(
                "Demo App",
                "This is a demo version. Sign out is disabled.",
                [{ text: "OK" }]
              )
            }
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={colors.red[500]}
            />
            <Text style={styles.signOutText}>Sign Out (Demo)</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {showPaywall && (
        <Paywall
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          feature="Premium Features"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.dark,
    letterSpacing: -0.5,
  },
  backButton: {
    padding: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.gray[50],
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[50],
  },
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  loadingText: {
    fontSize: typography.fontSizes.md,
    color: colors.gray[700],
    marginTop: spacing.sm,
  },
  profileHeader: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: spacing.lg,
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
    resizeMode: "cover",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.white,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: -10,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.white,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.black + "80",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    alignItems: "center",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  userEmail: {
    fontSize: 16,
    color: colors.gray[600],
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  joinDate: {
    fontSize: 14,
    color: colors.gray[500],
    textAlign: "center",
  },
  statsLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  statsSection: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray[600],
    textAlign: "center",
    fontWeight: "500",
  },
  subscriptionSection: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subscriptionCard: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subscriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: spacing.xs,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
  },
  subscriptionSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
  },
  premiumFeatures: {
    marginBottom: spacing.lg,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: spacing.lg,
  },
  featuresList: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  featureText: {
    fontSize: 14,
    color: colors.gray[600],
  },
  manageSubscriptionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  manageSubscriptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
    marginRight: spacing.sm,
  },
  upgradeSection: {
    marginBottom: spacing.lg,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
    marginRight: spacing.sm,
  },
  accountSection: {
    backgroundColor: colors.white,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: spacing.md,
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.red[500] + "20",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.red[500] + "40",
  },
  signOutText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.red[600],
    marginLeft: spacing.sm,
  },
});
