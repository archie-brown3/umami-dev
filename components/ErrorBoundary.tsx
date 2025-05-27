import React, { Component, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "@/utils/styleUtils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Error info:", errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to crash reporting service in production
    if (__DEV__) {
      console.warn("[ErrorBoundary] Error caught in development mode");
    } else {
      // In production, you would send this to a crash reporting service
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReportError = () => {
    const { error, errorInfo } = this.state;

    Alert.alert(
      "Report Error",
      "Would you like to report this error to help us improve the app?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          onPress: () => {
            // In production, send error report to your service
            console.log("[ErrorBoundary] Error reported:", {
              error,
              errorInfo,
            });
            Alert.alert("Thank you", "Error report sent successfully.");
          },
        },
      ]
    );
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Ionicons
              name="warning-outline"
              size={64}
              color={colors.red[500]}
              style={styles.errorIcon}
            />

            <Text style={styles.errorTitle}>Something went wrong</Text>

            <Text style={styles.errorMessage}>
              We're sorry, but something unexpected happened. Please try again.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={styles.debugText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.retryButton]}
                onPress={this.handleRetry}
              >
                <Ionicons
                  name="refresh-outline"
                  size={20}
                  color={colors.white}
                />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.reportButton]}
                onPress={this.handleReportError}
              >
                <Ionicons name="bug-outline" size={20} color={colors.primary} />
                <Text style={styles.reportButtonText}>Report Issue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  errorContainer: {
    alignItems: "center",
    maxWidth: 400,
  },
  errorIcon: {
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: "700",
    color: colors.dark,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  errorMessage: {
    fontSize: typography.fontSizes.md,
    color: colors.gray[600],
    textAlign: "center",
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  debugContainer: {
    backgroundColor: colors.gray[100],
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.xl,
    width: "100%",
  },
  debugTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: "600",
    color: colors.dark,
    marginBottom: spacing.sm,
  },
  debugText: {
    fontSize: typography.fontSizes.xs,
    color: colors.gray[600],
    fontFamily: "monospace",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: spacing.md,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  retryButton: {
    backgroundColor: colors.primary,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: typography.fontSizes.md,
    fontWeight: "600",
  },
  reportButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  reportButtonText: {
    color: colors.primary,
    fontSize: typography.fontSizes.md,
    fontWeight: "600",
  },
});

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
