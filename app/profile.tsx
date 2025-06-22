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
import { useAuth } from "@/context/AuthContext";
import { useRecipes } from "@/context/RecipeContext";
import { useFeatureGating } from "@/hooks/useFeatureGating";
import { useSubscription } from "@/context/SubscriptionContext";
import { Paywall } from "@/components/subscription/Paywall";
import { router, Stack } from "expo-router";
import { colors, spacing, borderRadius, typography } from "@/utils/styleUtils";
import { getUserRecipes } from "@/services/recipeService";

interface UserStats {
  totalRecipes: number;
  favoriteRecipes: number;
  recentlyAdded: number;
  totalCookTime: number;
  averageRating: number;
  joinedDate: string;
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { recipes } = useRecipes();
  const { isPremium, presentPaywall } = useSubscription();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadUserStats();
    }
  }, [user?.id]);

  const loadUserStats = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const userRecipes = await getUserRecipes(user.id);

      const stats: UserStats = {
        totalRecipes: userRecipes.length,
        favoriteRecipes: userRecipes.filter((r) => r.isFavorite).length,
        recentlyAdded: userRecipes.filter((r) => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(r.createdAt) > weekAgo;
        }).length,
        totalCookTime: userRecipes.reduce(
          (total, recipe) =>
            total + (recipe.prepTime || 0) + (recipe.cookTime || 0),
          0
        ),
        averageRating: 4.2, // Placeholder - would come from ratings system
        joinedDate: user.created_at || new Date().toISOString(),
      };

      setUserStats(stats);
    } catch (error) {
      console.error("Error loading user stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error("Error signing out:", error);
            Alert.alert("Error", "Failed to sign out. Please try again.");
          }
        },
      },
    ]);
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const formatCookTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        {/* Custom Header */}
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
            <View style={styles.actionButton}>
              {/* Empty placeholder for consistent spacing */}
            </View>
          </View>
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Disable the native header */}
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Custom Header */}
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
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Could add edit profile functionality here
              Alert.alert("Edit Profile", "Profile editing coming soon!");
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={22} color={colors.dark} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.email?.substring(0, 2).toUpperCase() || "US"}
              </Text>
            </View>
            <TouchableOpacity style={styles.editAvatarButton}>
              <Ionicons name="camera" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user.user_metadata?.full_name || "Recipe Chef"}
            </Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.joinDate}>
              Member since{" "}
              {formatJoinDate(userStats?.joinedDate || user.created_at)}
            </Text>
          </View>
        </View>

        {/* User Statistics */}
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
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {userStats ? formatCookTime(userStats.totalCookTime) : "0m"}
                </Text>
                <Text style={styles.statLabel}>Total Cook Time</Text>
              </View>
            </View>
          </View>
        )}

        {/* Subscription Status */}
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
                color={isPremium ? colors.orange[500] : colors.orange[500]}
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

        {/* Settings & Preferences */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>⚙️ Settings & Preferences</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color={colors.gray[600]}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingSubtitle}>
                  Meal reminders and updates
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.gray[400]}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="restaurant-outline"
                  size={24}
                  color={colors.gray[600]}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Dietary Preferences</Text>
                <Text style={styles.settingSubtitle}>
                  Allergies and restrictions
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.gray[400]}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="cloud-outline"
                  size={24}
                  color={colors.gray[600]}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Data & Backup</Text>
                <Text style={styles.settingSubtitle}>
                  Sync and export options
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.gray[400]}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <Ionicons
                  name="help-circle-outline"
                  size={24}
                  color={colors.gray[600]}
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Help & Support</Text>
                <Text style={styles.settingSubtitle}>FAQs and contact us</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.gray[400]}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.accountSection}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Ionicons
              name="log-out-outline"
              size={24}
              color={colors.red[500]}
            />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteAccountButton}>
            <Text style={styles.deleteAccountText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfoSection}>
          <Text style={styles.appVersion}>Umami Recipe App v1.0.0</Text>
          <Text style={styles.appCopyright}>
            © 2024 Umami. All rights reserved.
          </Text>
        </View>
      </ScrollView>

      <Paywall visible={false} onClose={() => {}} feature="Premium Features" />
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
  settingsSection: {
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
  settingsList: {
    gap: spacing.md,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: spacing.xs,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.gray[600],
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
  deleteAccountButton: {
    alignItems: "center",
    padding: spacing.md,
  },
  deleteAccountText: {
    fontSize: 14,
    color: colors.red[500],
    textDecorationLine: "underline",
  },
  appInfoSection: {
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  appVersion: {
    fontSize: 12,
    color: colors.gray[500],
    marginBottom: spacing.xs,
  },
  appCopyright: {
    fontSize: 12,
    color: colors.gray[400],
  },
});
