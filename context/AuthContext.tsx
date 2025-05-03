import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  PropsWithChildren,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  initialized: boolean;
};

const AuthContext = createContext<Partial<AuthContextType>>({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        console.log("Initializing auth session...");

        // Get initial session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error.message);
          setInitialized(true);
          return;
        }

        setSession(data.session);
        setUser(data.session ? data.session.user : null);

        if (data.session) {
          console.log("Session found for user:", data.session.user.email);
        } else {
          console.log("No active session found");
        }
      } catch (e) {
        console.error("Unexpected error during session initialization:", e);
      } finally {
        setInitialized(true);
      }
    };

    initializeSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state change:", event);
        setSession(newSession);
        setUser(newSession ? newSession.user : null);
        setInitialized(true);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    session,
    initialized,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
