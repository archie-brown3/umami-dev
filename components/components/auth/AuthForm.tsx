"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Apple, Mail, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { diagnoseSupabaseConnection } from "@/lib/supabase";
import { toast } from "sonner";

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Use the auth context
  const {
    signIn,
    signUp,
    signInWithOAuth,
    signInWithMagicLink,
    isAuthenticated,
  } = useAuth();

  // Email sign in/up functions
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log("[DEBUG] Starting sign-in process with email:", email);

    try {
      console.log("[DEBUG] Before signIn call");
      const { error: signInError } = await signIn(email, password);
      console.log("[DEBUG] After signIn call, error:", signInError);

      if (signInError) throw signInError;

      // Set a success message but don't navigate - the auth listener will handle it
      setMessage("Sign-in successful!");

      // Clear form fields on success
      setEmail("");
      setPassword("");
    } catch (error: any) {
      console.error("[DEBUG] Sign-in error:", error);
      setError(error.message || "Error signing in");
    } finally {
      setLoading(false);
      console.log("[DEBUG] Sign-in process completed");
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: signUpError } = await signUp(email, password);

      if (signUpError) throw signUpError;
      setMessage("Check your email for the confirmation link!");
    } catch (error: any) {
      setError(error.message || "Error signing up");
    } finally {
      setLoading(false);
    }
  };

  // OAuth sign in methods
  const handleOAuthSignIn = async (provider: "google" | "apple" | "github") => {
    setLoading(true);
    setError("");

    try {
      const { error: oauthError } = await signInWithOAuth(provider);

      if (oauthError) throw oauthError;
    } catch (error: any) {
      setError(error.message || `Error signing in with ${provider}`);
      setLoading(false);
    }
  };

  // Magic link sign in
  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { error: magicLinkError } = await signInWithMagicLink(email);

      if (magicLinkError) throw magicLinkError;
      setMessage("Check your email for the magic link!");
    } catch (error: any) {
      setError(error.message || "Error sending magic link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="mb-8 text-center">
        <img
          src="/logo.png"
          alt="Recipe Saver"
          width={100}
          height={100}
          className="mx-auto mb-4"
        />
        <h1 className="text-3xl font-bold">Recipe Saver</h1>
        <p className="text-gray-600">Your digital recipe collection</p>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            Sign in to access your recipes, meal plans, and more.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            {message && (
              <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-md">
                {message}
              </div>
            )}

            {error && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md">
                {error}
              </div>
            )}

            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleEmailSignIn} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="auth-email-input">Email</Label>
                  <Input
                    id="auth-email-input"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="auth-password-input">Password</Label>
                  <Input
                    id="auth-password-input"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300"></span>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">
                    OR CONTINUE WITH
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={() => handleOAuthSignIn("google")}
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>

                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={() => handleOAuthSignIn("apple")}
                  disabled={loading}
                >
                  <Apple className="w-5 h-5 mr-2" />
                  Apple
                </Button>

                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={handleMagicLinkSignIn}
                  disabled={loading}
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Email Magic Link
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleEmailSignUp} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300"></span>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">
                    OR CONTINUE WITH
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={() => handleOAuthSignIn("google")}
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>

                <Button
                  variant="outline"
                  type="button"
                  className="w-full"
                  onClick={() => handleOAuthSignIn("apple")}
                  disabled={loading}
                >
                  <Apple className="w-5 h-5 mr-2" />
                  Apple
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 items-center justify-center text-sm text-gray-500">
          <div>
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </div>
          <div className="text-xs">
            Free accounts include 8 recipe extractions. Upgrade to premium for
            unlimited extractions, meal planning, and nutrition information.
          </div>
        </CardFooter>
      </Card>

      {/* Add diagnostic button */}
      {import.meta.env.DEV && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={async () => {
            await diagnoseSupabaseConnection();
            toast.info("Diagnostic check complete - check console logs");
          }}
        >
          Run Diagnostics
        </Button>
      )}
    </div>
  );
}
