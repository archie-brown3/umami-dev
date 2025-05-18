import React, { createContext, useContext, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Define navigation types
type Route = string;
type NavigateFunction = (to: Route) => void;

interface NavigationContextType {
  currentRoute: Route;
  navigate: NavigateFunction;
}

// Create navigation context
const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

// Define your app's colors or import them
const navBarColors = {
  primary: "#4CAF50", // Green for the plus button
  activeText: "#4CAF50",
  inactiveText: "#888888",
  background: "#FFFFFF",
  border: "#E0E0E0",
  white: "#FFFFFF",
};

// BottomNavBar Component
const BottomNavBar = () => {
  const navigate = useNavigate();
  const currentRoute = useRoute();

  return (
    <View style={navBarStyles.navBarContainer}>
      <Pressable style={navBarStyles.navItem} onPress={() => navigate("/")}>
        <Text
          style={[
            navBarStyles.navLabel,
            currentRoute === "/" && navBarStyles.activeNavLabel,
          ]}
        >
          Home
        </Text>
      </Pressable>

      <Pressable
        style={navBarStyles.navItem}
        onPress={() => navigate("/recipes")}
      >
        <Text
          style={[
            navBarStyles.navLabel,
            currentRoute === "/recipes" && navBarStyles.activeNavLabel,
          ]}
        >
          Recipes
        </Text>
      </Pressable>

      {/* Simple Plus Button in the middle */}
      <Pressable
        style={navBarStyles.navItem} // Re-use navItem style for basic layout
        onPress={() => navigate("/add-recipe")}
      >
        <Text
          style={{
            fontSize: 24,
            color: navBarColors.primary,
            fontWeight: "bold",
          }}
        >
          +
        </Text>
      </Pressable>

      <Pressable
        style={navBarStyles.navItem}
        onPress={() => navigate("/meal-plan")}
      >
        <Text
          style={[
            navBarStyles.navLabel,
            currentRoute === "/meal-plan" && navBarStyles.activeNavLabel,
          ]}
        >
          Meal Plan
        </Text>
      </Pressable>

      <Pressable
        style={navBarStyles.navItem}
        onPress={() => navigate("/shopping")}
      >
        <Text
          style={[
            navBarStyles.navLabel,
            currentRoute === "/shopping" && navBarStyles.activeNavLabel,
          ]}
        >
          Shopping
        </Text>
      </Pressable>
    </View>
  );
};

const navBarStyles = StyleSheet.create({
  navBarContainer: {
    flexDirection: "row",
    height: 65,
    borderTopWidth: 1,
    borderTopColor: navBarColors.border,
    backgroundColor: navBarColors.background,
    alignItems: "center",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  navLabel: {
    fontSize: 11,
    color: navBarColors.inactiveText,
    marginTop: 2,
  },
  activeNavLabel: {
    color: navBarColors.activeText,
    fontWeight: "600",
  },
  // Removing the specific plusButton style for now as per "no styling yet"
  // It will use navItem for layout and inline style for the text '+'
});

// Provider component for navigation
export function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentRoute, setCurrentRoute] = useState<Route>("/");

  const navigate = (to: Route) => {
    setCurrentRoute(to);
  };

  return (
    <NavigationContext.Provider value={{ currentRoute, navigate }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <View style={{ flex: 1, backgroundColor: navBarColors.background }}>
          {children}
        </View>
        <BottomNavBar />
      </SafeAreaView>
    </NavigationContext.Provider>
  );
}

// Custom hook to use navigation
export function useNavigate(): NavigateFunction {
  const context = useContext(NavigationContext);

  if (context === undefined) {
    throw new Error("useNavigate must be used within a NavigationProvider");
  }

  return context.navigate;
}

// Hook to get current route
export function useRoute(): Route {
  const context = useContext(NavigationContext);

  if (context === undefined) {
    throw new Error("useRoute must be used within a NavigationProvider");
  }

  return context.currentRoute;
}

// Simple router component to show content based on current route
interface RouterProps {
  routes: Record<string, React.ReactNode>;
  defaultRoute?: string;
}

export function Router({ routes, defaultRoute = "/" }: RouterProps) {
  const currentRoute = useRoute();

  // Find the component to render based on the current route
  const componentToRender = routes[currentRoute] || routes[defaultRoute];

  return <>{componentToRender}</>;
}
