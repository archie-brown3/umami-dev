import React, { useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[]; // Optional: For role-based access control
}

/**
 * A wrapper component that protects routes requiring authentication
 * Redirects to login page if user is not authenticated
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
}) => {
  const { isAuthenticated, isLoading, initialAuthLoading, userData, session } =
    useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Add an effect to check authentication status whenever it changes
  useEffect(() => {
    // If clearly not authenticated, redirect to login
    if (!isLoading && !initialAuthLoading && !isAuthenticated) {
      navigate("/login", { state: { from: location.pathname }, replace: true });
    }
  }, [
    isAuthenticated,
    isLoading,
    initialAuthLoading,
    navigate,
    location.pathname,
  ]);

  // Show loading spinner only during initial authentication check
  // This prevents loading spinners during subsequent auth operations
  if (initialAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-recipe-green"></div>
      </div>
    );
  }

  // Double check that we have authentication
  // This enforces a stricter check that both isAuthenticated flag AND session exist
  if (!isAuthenticated || !session) {
    // Store the attempted URL for redirecting after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If role-based protection is required, check user's role
  // This is optional and can be expanded based on your user data structure
  if (requiredRoles.length > 0) {
    // Example: check if user has premium subscription for premium-only routes
    const isPremium = userData?.subscription?.tier === "premium";

    if (requiredRoles.includes("premium") && !isPremium) {
      // Redirect to upgrade page or show access denied
      return <Navigate to="/subscription" replace />;
    }
  }

  // User is authenticated (and has required roles if specified)
  return <>{children}</>;
};

export default ProtectedRoute;
