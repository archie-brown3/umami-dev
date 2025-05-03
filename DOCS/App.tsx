// import {
//     BrowserRouter,
//     Route,
//     Routes,
//     Navigate,
//     useLocation,
//     useNavigate,
//   } from "react-router-dom";
//   import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
//   import { RecipeProvider } from "./context/RecipeContext";
//   import { CupboardProvider } from "./context/CupboardContext";
//   import { AuthProvider } from "./context/AuthContext";
//   import { useAuth } from "./context/AuthContext";
//   import { NetworkProvider } from "./context/NetworkContext";
//   import { TooltipProvider } from "@/components/ui/tooltip";
//   import { Toaster } from "@/components/ui/toaster";
//   import { Toaster as Sonner } from "@/components/ui/sonner";
//   import Index from "./pages/Index";
//   import RecipesPage from "./pages/RecipesPage";
//   import RecipeDetail from "./pages/RecipeDetail";
//   import AddRecipePage from "./pages/AddRecipePage";
//   import EditRecipePage from "./pages/EditRecipePage";
//   import MealPlanPage from "./pages/MealPlanPage";
//   import ShoppingListPage from "./pages/ShoppingListPage";
//   import CupboardPage from "./pages/CupboardPage";
//   import Login from "./pages/Login";
//   import SubscriptionPage from "./pages/SubscriptionPage";
//   import ProfilePage from "./pages/ProfilePage";
//   import ProtectedRoute from "./components/ProtectedRoute";
//   import AuthCallback from "./components/AuthCallback";
//   import { initialize as initializeNutritionService } from "@/services/nutrition";
//   import { useEffect } from "react";
//   import SettingsPage from "./pages/SettingsPage";
//   import DebugPage from "./pages/DebugPage";
//   import { useSupabaseDiagnostics } from "@/hooks/useSupabaseDiagnostics";
//   import { checkSupabaseConfig } from "@/utils/supabaseConnectionCheck";
//   import { Capacitor } from "@capacitor/core";
//   import { supabase } from "@/lib/supabase";
//   import { refreshIOSSession } from "./utils/supabase/iosAuth";

//   const queryClient = new QueryClient();

//   // Global auth check component
//   const AuthCheck = ({ children }: { children: React.ReactNode }) => {
//     const { isAuthenticated, initialAuthLoading, onNavigationRequired } =
//       useAuth();
//     const location = useLocation();
//     const navigate = useNavigate();

//     // Define public routes that don't require authentication
//     const publicPaths = ["/login", "/auth/callback", "/debug"];
//     const isPublicPath = publicPaths.some(
//       (path) =>
//         location.pathname === path || location.pathname.startsWith("/auth/")
//     );

//     // Handle auth redirection on initial load
//     useEffect(() => {
//       // Only redirect if we've finished initial loading and user is not authenticated
//       if (!initialAuthLoading && !isAuthenticated && !isPublicPath) {
//         console.log(
//           `[AuthCheck] Not authenticated, redirecting from ${location.pathname} to login`
//         );
//         navigate("/login", { state: { from: location.pathname }, replace: true });
//       }
//     }, [
//       isAuthenticated,
//       initialAuthLoading,
//       location.pathname,
//       isPublicPath,
//       navigate,
//     ]);

//     // Handle auth navigation events
//     useEffect(() => {
//       // Subscribe to navigation events from auth context
//       console.log("[AuthCheck] Setting up navigation event listener");

//       const unsubscribe = onNavigationRequired((event) => {
//         console.log(
//           `[AuthCheck] Handling navigation event: ${event.type} to ${event.destination}`
//         );

//         // Special handling for sign-out events to ensure complete state reset
//         if (event.type === "SIGN_OUT") {
//           console.log(
//             "[AuthCheck] Sign-out event detected, ensuring clean state reset"
//           );

//           // Add a small delay to ensure state is fully propagated
//           setTimeout(() => {
//             // Use replace: true to prevent back navigation to authenticated routes
//             navigate(event.destination, { replace: true });
//             console.log(
//               `[AuthCheck] Navigation completed to ${event.destination}`
//             );

//             // Verify navigation actually happened
//             setTimeout(() => {
//               if (window.location.pathname !== event.destination) {
//                 console.log(
//                   `[AuthCheck] Navigation verification failed, forcing direct navigation`
//                 );
//                 window.location.href = event.destination;
//               }
//             }, 100);
//           }, 50);
//         } else {
//           // Normal navigation for other event types
//           setTimeout(() => {
//             // Use replace: true to prevent back navigation issues
//             navigate(event.destination, { replace: true });
//             console.log(
//               `[AuthCheck] Navigation completed to ${event.destination}`
//             );

//             // Verify navigation actually happened
//             setTimeout(() => {
//               if (window.location.pathname !== event.destination) {
//                 console.log(
//                   `[AuthCheck] Navigation verification failed, forcing direct navigation`
//                 );
//                 window.location.href = event.destination;
//               }
//             }, 100);
//           }, 50);
//         }
//       });

//       return () => {
//         console.log("[AuthCheck] Cleaning up navigation event listener");
//         unsubscribe();
//       };
//     }, [onNavigationRequired, navigate]);

//     return <>{children}</>;
//   };

//   // Initialize Supabase diagnostics at the application level
//   const SupabaseInitializer = ({ children }: { children: React.ReactNode }) => {
//     // Run diagnostics early in the app lifecycle
//     const diagnosticResult = useSupabaseDiagnostics();

//     useEffect(() => {
//       // Check Supabase config on component mount
//       checkSupabaseConfig().then((configOk) => {
//         if (configOk) {
//           console.log("[SupabaseInitializer] ✅ Supabase configuration verified");
//         } else {
//           console.error(
//             "[SupabaseInitializer] ❌ Supabase configuration issues detected"
//           );
//         }
//       });
//     }, []);

//     useEffect(() => {
//       // Log diagnostic results when available
//       if (diagnosticResult.ran) {
//         if (diagnosticResult.success) {
//           console.log(`[SupabaseInitializer] ✅ ${diagnosticResult.message}`);
//         } else {
//           console.error(
//             `[SupabaseInitializer] ❌ ${diagnosticResult.message}`,
//             diagnosticResult.details
//           );
//         }
//       }
//     }, [diagnosticResult]);

//     // Set up deep link handling for iOS
//     useEffect(() => {
//       if (Capacitor.isNativePlatform()) {
//         import("@capacitor/app")
//           .then(({ App: CapApp }) => {
//             const handleAppUrlOpen = ({ url }: { url: string }) => {
//               console.log("[DeepLink] App opened with URL:", url);

//               // Handle Supabase auth redirects
//               if (
//                 url.includes("recipesaver://login") ||
//                 url.includes("recipesaver://auth") ||
//                 url.includes("io.recipesaver://login") ||
//                 url.includes("io.recipesaver://auth")
//               ) {
//                 console.log("[DeepLink] Auth deep link detected:", url);

//                 // Check for possible query parameters or fragments
//                 const hasAccessToken = url.includes("access_token");
//                 const hasRefreshToken = url.includes("refresh_token");
//                 const hasError =
//                   url.includes("error=") || url.includes("error_description=");

//                 if (hasError) {
//                   console.error("[DeepLink] Error in auth redirect:", url);
//                   window.location.href = "/login?authError=true";
//                   return;
//                 }

//                 if (hasAccessToken && hasRefreshToken) {
//                   console.log("[DeepLink] Auth tokens found in deep link");

//                   try {
//                     // Extract tokens from URL - handle both fragment and query parameter formats
//                     let accessToken, refreshToken;

//                     if (url.includes("#")) {
//                       // Fragment format (#access_token=...)
//                       const fragment = url.split("#")[1];
//                       const params = new URLSearchParams(fragment);
//                       accessToken = params.get("access_token");
//                       refreshToken = params.get("refresh_token");
//                     } else {
//                       // Query parameter format (?access_token=...)
//                       const queryString = url.includes("?")
//                         ? url.split("?")[1]
//                         : "";
//                       const params = new URLSearchParams(queryString);
//                       accessToken = params.get("access_token");
//                       refreshToken = params.get("refresh_token");
//                     }

//                     if (accessToken && refreshToken) {
//                       // Set the session manually with the extracted tokens
//                       supabase.auth
//                         .setSession({
//                           access_token: accessToken,
//                           refresh_token: refreshToken,
//                         })
//                         .then(({ data, error }) => {
//                           if (error) {
//                             console.error(
//                               "[DeepLink] Error setting session:",
//                               error
//                             );
//                             window.location.href = "/login?sessionError=true";
//                           } else {
//                             console.log("[DeepLink] Session successfully set");

//                             // Extra refresh for iOS to ensure persistence
//                             if (Capacitor.getPlatform() === "ios") {
//                               refreshIOSSession().then((success) => {
//                                 console.log(
//                                   `[DeepLink] iOS session refresh ${
//                                     success ? "succeeded" : "failed"
//                                   }`
//                                 );
//                                 window.location.href = "/recipes";
//                               });
//                             } else {
//                               // Redirect to app home or recipes page
//                               window.location.href = "/recipes";
//                             }
//                           }
//                         });
//                     } else {
//                       console.error("[DeepLink] Tokens not found in URL");
//                       window.location.href =
//                         "/auth/callback?url=" + encodeURIComponent(url);
//                     }
//                   } catch (error) {
//                     console.error(
//                       "[DeepLink] Error processing auth deep link:",
//                       error
//                     );
//                     window.location.href =
//                       "/auth/callback?error=processing&url=" +
//                       encodeURIComponent(url);
//                   }
//                 } else {
//                   // No tokens in URL, redirect to auth callback handler
//                   console.log(
//                     "[DeepLink] No tokens in URL, redirecting to callback handler"
//                   );
//                   window.location.href =
//                     "/auth/callback?url=" + encodeURIComponent(url);
//                 }
//               }
//             };

//             // Register deep link listener
//             CapApp.addListener("appUrlOpen", handleAppUrlOpen);

//             return () => {
//               CapApp.removeAllListeners();
//             };
//           })
//           .catch((error) => {
//             console.error(
//               "[DeepLink] Error setting up deep link handler:",
//               error
//             );
//           });
//       }
//     }, []);

//     // Add visibility change handler for iOS
//     useEffect(() => {
//       if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
//         const handleVisibilityChange = async () => {
//           if (document.visibilityState === "visible") {
//             console.log("[App] iOS app became visible, refreshing session");

//             try {
//               const refreshSuccessful = await refreshIOSSession();
//               console.log(
//                 `[App] iOS session refresh ${
//                   refreshSuccessful ? "succeeded" : "failed"
//                 }`
//               );
//             } catch (error) {
//               console.error(
//                 "[App] Error during visibility session refresh:",
//                 error
//               );
//             }
//           }
//         };

//         document.addEventListener("visibilitychange", handleVisibilityChange);

//         return () => {
//           document.removeEventListener(
//             "visibilitychange",
//             handleVisibilityChange
//           );
//         };
//       }
//     }, []);

//     return <>{children}</>;
//   };

//   const App = () => {
//     // Initialize nutrition service on app load
//     useEffect(() => {
//       const initNutrition = async () => {
//         try {
//           const status = await initializeNutritionService();
//           console.log("Nutrition service initialized automatically:", status);
//         } catch (error) {
//           console.error("Failed to initialize nutrition service:", error);
//         }
//       };

//       initNutrition();
//     }, []);

//     return (
//       <QueryClientProvider client={queryClient}>
//         <BrowserRouter>
//           <NetworkProvider>
//             <SupabaseInitializer>
//               <AuthProvider>
//                 <RecipeProvider>
//                   <CupboardProvider>
//                     <TooltipProvider>
//                       <Toaster />
//                       <Sonner />
//                       <Routes>
//                         {/* Add a wrapper route that includes the AuthCheck */}
//                         <Route
//                           path="*"
//                           element={
//                             <AuthCheck>
//                               <Routes>
//                                 {/* Public routes */}
//                                 <Route path="/" element={<Index />} />
//                                 <Route path="/login" element={<Login />} />
//                                 <Route
//                                   path="/auth/callback"
//                                   element={<AuthCallback />}
//                                 />

//                                 {/* Debug route - accessible in all environments for troubleshooting */}
//                                 <Route path="/debug" element={<DebugPage />} />

//                                 {/* Subscription page (accessible to all authenticated users) */}
//                                 <Route
//                                   path="/subscription"
//                                   element={
//                                     <ProtectedRoute>
//                                       <SubscriptionPage />
//                                     </ProtectedRoute>
//                                   }
//                                 />

//                                 {/* Protected routes */}
//                                 <Route
//                                   path="/recipes"
//                                   element={
//                                     <ProtectedRoute>
//                                       <RecipesPage />
//                                     </ProtectedRoute>
//                                   }
//                                 />
//                                 <Route
//                                   path="/recipes/:id"
//                                   element={
//                                     <ProtectedRoute>
//                                       <RecipeDetail />
//                                     </ProtectedRoute>
//                                   }
//                                 />
//                                 <Route
//                                   path="/add-recipe"
//                                   element={
//                                     <ProtectedRoute>
//                                       <AddRecipePage />
//                                     </ProtectedRoute>
//                                   }
//                                 />
//                                 <Route
//                                   path="/recipes/edit/:id"
//                                   element={
//                                     <ProtectedRoute>
//                                       <EditRecipePage />
//                                     </ProtectedRoute>
//                                   }
//                                 />

//                                 {/* Premium features (requires premium subscription) */}
//                                 <Route
//                                   path="/meal-plan"
//                                   element={
//                                     <ProtectedRoute requiredRoles={["premium"]}>
//                                       <MealPlanPage />
//                                     </ProtectedRoute>
//                                   }
//                                 />
//                                 <Route
//                                   path="/shopping-list"
//                                   element={
//                                     <ProtectedRoute>
//                                       <ShoppingListPage />
//                                     </ProtectedRoute>
//                                   }
//                                 />
//                                 <Route
//                                   path="/cupboard"
//                                   element={
//                                     <ProtectedRoute>
//                                       <CupboardPage />
//                                     </ProtectedRoute>
//                                   }
//                                 />
//                                 <Route
//                                   path="/settings"
//                                   element={
//                                     <ProtectedRoute>
//                                       <SettingsPage />
//                                     </ProtectedRoute>
//                                   }
//                                 />
//                                 <Route
//                                   path="/profile"
//                                   element={
//                                     <ProtectedRoute>
//                                       <ProfilePage />
//                                     </ProtectedRoute>
//                                   }
//                                 />
//                                 <Route
//                                   path="*"
//                                   element={<Navigate to="/" replace />}
//                                 />
//                               </Routes>
//                             </AuthCheck>
//                           }
//                         />
//                       </Routes>
//                     </TooltipProvider>
//                   </CupboardProvider>
//                 </RecipeProvider>
//               </AuthProvider>
//             </SupabaseInitializer>
//           </NetworkProvider>
//         </BrowserRouter>
//       </QueryClientProvider>
//     );
//   };

//   export default App;
