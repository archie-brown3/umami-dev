import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import * as Network from 'expo-network';
import { Platform, AppState } from 'react-native';
import Constants from "expo-constants";

// Determine if running on iOS
const isIOS = Platform.OS === 'ios';

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL and Anon Key are required!");
  console.error("URL:", supabaseUrl ? "[DEFINED]" : "[UNDEFINED]");
  console.error("Anon Key:", supabaseAnonKey ? "[DEFINED]" : "[UNDEFINED]");
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Setup app state listener for auth refresh
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
    // Try to refresh session when app comes to foreground
    supabase.auth.refreshSession();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

// Monitor network state and auth events
export const setupSupabaseMonitoring = async () => {
  let lastNetworkState = false;
  
  // Initial check
  try {
    const networkState = await Network.getNetworkStateAsync();
    lastNetworkState = !!networkState.isConnected;
    console.log(`Initial network state: ${lastNetworkState ? 'Connected' : 'Disconnected'}`);
  } catch (e) {
    console.error('Failed to check network state:', e);
  }

  // Function to check network and refresh session
  const checkNetworkAndRefresh = async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      const isConnected = !!networkState.isConnected;
      
      // If we've gone from disconnected to connected, refresh session
      if (!lastNetworkState && isConnected) {
        console.log('Network reconnected, refreshing session...');
        await supabase.auth.refreshSession();
      }
      
      lastNetworkState = isConnected;
    } catch (e) {
      console.error('Network check failed:', e);
    }
  };

  // Set up periodic network checks (every 10 seconds)
  const networkInterval = setInterval(checkNetworkAndRefresh, 10000);
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    console.log(`Auth event: ${event}`);
    if (session) {
      console.log(`Session active for user: ${session.user?.email}`);
    } else {
      console.log('No active session');
    }
  });
  
  // Cleanup function
  return () => {
    clearInterval(networkInterval);
  };
};

// Initialize monitoring
setupSupabaseMonitoring().catch(e => {
  console.error('Failed to setup Supabase monitoring:', e);
});
