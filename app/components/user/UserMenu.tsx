import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { LogOut, Settings, User, Crown } from "../../lib/icons";
import { useNavigate } from "../../lib/navigation";
import { supabase } from "../../lib/supabase";

/**
 * UserMenu component that displays user information and actions
 * Shown in the header when a user is authenticated
 */
export default function UserMenu() {
  const { user, userData, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If not authenticated, show sign in button
  if (!isAuthenticated || !user) {
    return (
      <Button variant="ghost" onPress={() => navigate("/login")}>
        Sign In
      </Button>
    );
  }

  // Generate avatar initials from email
  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : "US";

  // Check if user has premium subscription
  const isPremium = userData?.subscription?.tier === "premium";

  // Enhanced signOut with guaranteed redirect
  const handleSignOut = async () => {
    try {
      console.log("Signing out user...");
      // Directly use supabase.auth.signOut() instead of context function
      await supabase.auth.signOut();
      console.log("Signed out successfully");
      // Redirect to home
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" style={styles.avatarButton}>
          <Avatar>
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback style={styles.avatarFallback}>
              {initials}
            </AvatarFallback>
          </Avatar>
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Crown size={12} color="#fff" />
            </View>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <View style={styles.userInfo}>
            <Text>{user.email}</Text>
            {isPremium && (
              <View style={styles.premiumLabel}>
                <Crown size={12} color="#f59e0b" />
                <Text style={styles.premiumText}>Premium Member</Text>
              </View>
            )}
          </View>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => navigate("/profile")}>
          <View style={styles.menuItem}>
            <User size={16} style={styles.menuIcon} />
            <Text>Profile</Text>
          </View>
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={() => navigate("/settings")}>
          <View style={styles.menuItem}>
            <Settings size={16} style={styles.menuIcon} />
            <Text>Settings</Text>
          </View>
        </DropdownMenuItem>

        {!isPremium && (
          <DropdownMenuItem onSelect={() => navigate("/subscription")}>
            <View style={styles.menuItem}>
              <Crown size={16} style={styles.menuIcon} />
              <Text>Upgrade to Premium</Text>
            </View>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={handleSignOut}>
          <View style={styles.menuItem}>
            <LogOut size={16} style={[styles.menuIcon, styles.signOutIcon]} />
            <Text style={styles.signOutText}>Sign out</Text>
          </View>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const styles = StyleSheet.create({
  avatarButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    position: "relative",
    padding: 0,
  },
  avatarFallback: {
    backgroundColor: "#4ade80",
    color: "#fff",
  },
  premiumBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#f59e0b",
    borderRadius: 10,
    padding: 2,
  },
  userInfo: {
    flexDirection: "column",
  },
  premiumLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  premiumText: {
    fontSize: 12,
    color: "#f59e0b",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuIcon: {
    marginRight: 8,
  },
  signOutIcon: {
    color: "#ef4444",
  },
  signOutText: {
    color: "#ef4444",
  },
});
