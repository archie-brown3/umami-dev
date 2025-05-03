import React from "react";
import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../context/AuthContext";

interface UserDetailProps {
  user: User;
}

export const UserDetail: React.FC<UserDetailProps> = ({ user }) => {
  const { userData } = useAuth();
  const isPremium = userData?.subscription?.tier === "premium";

  // Generate initials from email
  const initials = user.email ? user.email.substring(0, 2).toUpperCase() : "US";

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-white text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <h3 className="text-xl font-semibold">
                {user.user_metadata?.full_name || user.email}
              </h3>

              {isPremium && (
                <Badge
                  variant="outline"
                  className="bg-amber-100 text-amber-800 border-amber-200"
                >
                  Premium
                </Badge>
              )}
            </div>

            <p className="text-gray-500 mt-1">{user.email}</p>

            <div className="mt-4 grid gap-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Account ID:</span>
                <span className="font-mono text-xs truncate">{user.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Last Sign In:</span>
                <span>
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString()
                    : "N/A"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Created:</span>
                <span>
                  {user.created_at
                    ? new Date(user.created_at).toLocaleString()
                    : "N/A"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Subscription:</span>
                <span className={isPremium ? "text-amber-600" : ""}>
                  {isPremium ? "Premium" : "Free"}
                </span>
              </div>

              {userData?.subscription?.recipeExtractionsRemaining !==
                undefined && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Extractions Remaining:</span>
                  <span>
                    {userData.subscription.recipeExtractionsRemaining}
                  </span>
                </div>
              )}

              {userData?.subscription?.validUntil && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Valid Until:</span>
                  <span>
                    {new Date(
                      userData.subscription.validUntil
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
