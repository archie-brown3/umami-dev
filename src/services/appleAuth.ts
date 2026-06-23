import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto";
import { supabase } from "@/lib/supabase";
import { Platform } from "react-native";

// Apple OAuth configuration
const APPLE_CONFIG = {
  clientId: "io.recipesaver.app", // Your bundle identifier (must match Supabase Authorized Client IDs)
  scopes: ["name", "email"],
};

interface AppleAuthResponse {
  type: "success" | "error" | "dismiss";
  data?: {
    user: any;
    session: any;
  };
  error?: any;
}

export class AppleAuthService {
  private static instance: AppleAuthService;

  public static getInstance(): AppleAuthService {
    if (!AppleAuthService.instance) {
      AppleAuthService.instance = new AppleAuthService();
    }
    return AppleAuthService.instance;
  }

  /**
   * Check if Apple Sign In is available on this device
   */
  public async isAvailable(): Promise<boolean> {
    // Apple Sign In is only available on iOS 13+ and actual devices
    return Platform.OS === "ios";
  }

  /**
   * Sign in with Apple using Supabase OAuth
   * This method properly handles the OAuth flow with correct configuration
   */
  public async signInWithApple(): Promise<AppleAuthResponse> {
    try {
      // Check if available
      if (!(await this.isAvailable())) {
        return {
          type: "error",
          error: new Error("Apple Sign In not available on this device"),
        };
      }

      // Create redirect URI for Expo
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: "umami-dev", // Use your app scheme from app.json
        path: "auth/callback",
      });

      console.log("Apple Auth Redirect URI:", redirectUri);

      // Use Supabase's OAuth flow with Apple
      // This opens the browser for authentication
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: redirectUri,
          scopes: "name email",
        },
      });

      if (error) {
        console.error("Apple OAuth error:", error);
        return {
          type: "error",
          error,
        };
      }

      console.log("Apple OAuth initiated successfully");

      return {
        type: "success",
        data: {
          user: null, // Will be available after redirect completion
          session: null, // Will be available after redirect completion
        },
      };
    } catch (error) {
      console.error("Apple OAuth error:", error);
      return {
        type: "error",
        error,
      };
    }
  }

  /**
   * Handle the OAuth callback after user returns from Apple
   */
  public async handleOAuthCallback(url: string): Promise<AppleAuthResponse> {
    try {
      // Parse the URL to extract session data
      const response = await supabase.auth.getSession();

      if (response.error) {
        return {
          type: "error",
          error: response.error,
        };
      }

      return {
        type: "success",
        data: {
          user: response.data.session?.user || null,
          session: response.data.session,
        },
      };
    } catch (error) {
      return {
        type: "error",
        error,
      };
    }
  }
}

// Export singleton instance
export const appleAuthService = AppleAuthService.getInstance();
