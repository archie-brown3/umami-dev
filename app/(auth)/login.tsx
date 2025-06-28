import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { Link, router } from "expo-router";
import { colors, spacing } from "@/utils/styleUtils";
import { SafeAreaView } from "react-native-safe-area-context";
import AppleSignInButton from "@/components/AppleSignInButton";
import AuthDivider from "@/components/AuthDivider";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    console.log("[Login] Attempting login for:", email);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      console.error("[Login] Login failed:", error);
      Alert.alert("Error", error.message);
    } else {
      console.log("[Login] Login successful");
    }
  };

  const handleAppleSignInSuccess = () => {
    console.log("[Login] Apple Sign In successful, navigating to tabs");
    // Navigate to main app on successful Apple Sign In
    router.replace("/(tabs)");
  };

  const handleAppleSignInError = (error: any) => {
    console.log("Apple Sign In error handled:", error);
    // Error handling is already done in the AppleSignInButton component
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <Text style={styles.title}>Recipe App</Text>
              <Text style={styles.subtitle}>Log in to your account</Text>

              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                enablesReturnKeyAutomatically
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                returnKeyType="done"
                enablesReturnKeyAutomatically
                onSubmitEditing={handleLogin}
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Logging in..." : "Log In"}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <AuthDivider />

              {/* Apple Sign In Button */}
              <AppleSignInButton
                onSuccess={handleAppleSignInSuccess}
                onError={handleAppleSignInError}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Link href="/(auth)/register" asChild>
                  <TouchableOpacity>
                    <Text style={styles.link}>Sign Up</Text>
                  </TouchableOpacity>
                </Link>
              </View>

              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.link}>Forgot Password?</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: spacing.sm,
    color: colors.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.gray[500],
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  input: {
    backgroundColor: colors.gray[100],
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    fontSize: 16,
    color: colors.gray[900],
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  footerText: {
    color: colors.gray[500],
  },
  link: {
    color: colors.primary,
    fontWeight: "600",
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: spacing.md,
  },
});
