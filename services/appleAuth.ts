import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto";
import { supabase } from "@/lib/supabase";
import { Platform } from "react-native";

// Apple OAuth configuration
const APPLE_CONFIG = {
  clientId: "io.recipesaver.app", // Your bundle identifier
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
   * Sign in with Apple using Supabase OAuth (Managed Expo)
   * This is the recommended approach for managed Expo
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

      // Create redirect URI for managed Expo
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: "io.recipesaver",
        path: "auth/callback",
      });

      console.log("Apple Auth Redirect URI:", redirectUri);

      // Use Supabase's OAuth flow with Apple
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: redirectUri,
          scopes: "name email",
        },
      });

      if (error) {
        return {
          type: "error",
          error,
        };
      }

      // For OAuth flow, the actual auth happens via redirect
      // This just initiates the flow - the session will be available after redirect
      console.log("Apple OAuth initiated:", data);

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
   * Alternative method using Auth Session with manual token exchange
   * Use this if you need more control over the flow
   */
  public async signInWithAppleManual(): Promise<AppleAuthResponse> {
    try {
      if (!(await this.isAvailable())) {
        return {
          type: "error",
          error: new Error("Apple Sign In not available on this device"),
        };
      }

      // Discovery document for Apple
      const discovery = {
        authorizationEndpoint: "https://appleid.apple.com/auth/authorize",
        tokenEndpoint: "https://appleid.apple.com/auth/token",
      };

      // Create auth request
      const request = new AuthSession.AuthRequest({
        clientId: "io.recipesaver.app", // Your bundle identifier
        scopes: ["name", "email"],
        redirectUri: AuthSession.makeRedirectUri({
          scheme: "io.recipesaver",
          path: "auth/callback",
        }),
        responseType: AuthSession.ResponseType.Code,
        usePKCE: true,
      });

      // Start authentication session
      const result = await request.promptAsync(discovery);

      if (result.type !== "success") {
        return {
          type: result.type as "error" | "dismiss",
          error: result.type === "error" ? result.error : null,
        };
      }

      // Get authorization code
      const { code } = result.params;
      if (!code) {
        return {
          type: "error",
          error: new Error("No authorization code received"),
        };
      }

      // You would need to exchange this code for tokens on your server
      // For now, we'll try to use it with Supabase
      console.log("Apple auth code received:", code);

      // Note: This might not work directly as Supabase expects ID tokens
      // You may need to exchange the code for tokens on your server first
      return {
        type: "success",
        data: {
          user: null,
          session: null,
        },
      };
    } catch (error) {
      console.error("Apple manual auth error:", error);
      return {
        type: "error",
        error,
      };
    }
  }
}

// Export singleton instance
export const appleAuthService = AppleAuthService.getInstance();
