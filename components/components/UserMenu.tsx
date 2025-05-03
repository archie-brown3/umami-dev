import React from "react";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Settings, User, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

/**
 * UserMenu component that displays user information and actions
 * Shown in the header when a user is authenticated
 */
const UserMenu: React.FC = () => {
  const { user, userData, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If not authenticated, show sign in button
  if (!isAuthenticated || !user) {
    return (
      <Button variant="ghost" onClick={() => navigate("/login")}>
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
      toast.success("Signed out successfully");
      // Force redirect to home
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar>
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-recipe-green text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          {isPremium && (
            <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-0.5">
              <Crown size={12} className="text-white" />
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>{user.email}</span>
            {isPremium && (
              <span className="text-xs text-amber-500 font-normal flex items-center gap-1">
                <Crown size={12} />
                Premium Member
              </span>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>

        {!isPremium && (
          <DropdownMenuItem onClick={() => navigate("/subscription")}>
            <Crown className="mr-2 h-4 w-4" />
            <span>Upgrade to Premium</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserMenu;
