import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Define types
interface User {
  id: string;
  email: string;
  user_metadata?: {
    avatar_url?: string;
  };
}

interface UserData {
  id: string;
  email: string;
  subscription?: {
    tier: "free" | "premium";
    validUntil?: string;
  };
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const storedUser = await AsyncStorage.getItem("user");
      const storedUserData = await AsyncStorage.getItem("userData");

      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }

      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Mock authentication response
      const mockUser: User = {
        id: "123",
        email,
        user_metadata: {
          avatar_url: "https://via.placeholder.com/40",
        },
      };

      const mockUserData: UserData = {
        id: "123",
        email,
        subscription: {
          tier: "free",
        },
      };

      setUser(mockUser);
      setUserData(mockUserData);

      await AsyncStorage.setItem("user", JSON.stringify(mockUser));
      await AsyncStorage.setItem("userData", JSON.stringify(mockUserData));
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Mock authentication response
      const mockUser: User = {
        id: "123",
        email,
      };

      const mockUserData: UserData = {
        id: "123",
        email,
        subscription: {
          tier: "free",
        },
      };

      setUser(mockUser);
      setUserData(mockUserData);

      await AsyncStorage.setItem("user", JSON.stringify(mockUser));
      await AsyncStorage.setItem("userData", JSON.stringify(mockUserData));
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);

      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("userData");

      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
