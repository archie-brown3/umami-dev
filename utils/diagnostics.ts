import * as Network from 'expo-network';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { recipeService } from '../services/recipeService';
import axios from 'axios';
import * as Application from 'expo-application';
import NetInfo from '@react-native-community/netinfo';

// Helper function to check if a string is a valid URL
const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

// Helper to safely fetch stored session
const getStoredSession = async (): Promise<any> => {
  try {
    // The storage key format has changed to include the project reference
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0] || '';
    const key = `sb-${projectRef}-auth-token`;
    console.log(`Checking for auth token with key: ${key}`);
    const storedSession = await AsyncStorage.getItem(key);
    return storedSession ? JSON.parse(storedSession) : null;
  } catch (e) {
    console.error('Failed to parse stored session:', e);
    return null;
  }
};

// Helper function to check for network connectivity using multiple methods
const checkNetworkConnectivity = async (): Promise<{
  isConnected: boolean;
  connectionType: string | null;
  isInternetReachable: boolean | null;
  netInfoDetails: any;
  networkStateDetails: any;
}> => {
  try {
    // Get network state using expo-network
    const networkState = await Network.getNetworkStateAsync();
    
    // Also check using NetInfo for comparison
    const netInfo = await NetInfo.fetch();
    
    return {
      isConnected: networkState.isConnected === true,
      connectionType: networkState.type || null,
      isInternetReachable: networkState.isInternetReachable === true ? true : 
                         networkState.isInternetReachable === false ? false : null,
      netInfoDetails: netInfo,
      networkStateDetails: networkState
    };
  } catch (e) {
    console.error('Failed to check network connectivity:', e);
    return {
      isConnected: false,
      connectionType: null,
      isInternetReachable: null,
      netInfoDetails: null,
      networkStateDetails: null
    };
  }
};

// Test direct HTTP connection with timeout
const testNativeHttpConnection = async (url: string): Promise<{
  success: boolean;
  statusCode?: number;
  responseTime?: number;
  error?: string;
  responseBody?: string;
  headers?: any;
}> => {
  try {
    console.log(`Testing direct HTTP connection to: ${url}`);
    
    const startTime = Date.now();
    
    // Create a promise that times out after 10 seconds
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new Error('HTTP connection test timed out after 10 seconds')), 10000);
    });
    
    // First try with fetch API with timeout
    try {
      // Race the fetch against the timeout
      const fetchPromise = fetch(`${url}/rest/v1/?apikey=${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
          'X-Client-Info': `diagnostics/${Platform.OS}`,
        },
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      const endTime = Date.now();
      const responseText = await response.text();
      
      console.log(`Fetch API Response: Status ${response.status}, Time: ${endTime - startTime}ms`);
      console.log(`Response headers:`, response.headers);
      console.log(`Response body: ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`);
      
      return {
        success: response.status >= 200 && response.status < 300,
        statusCode: response.status,
        responseTime: endTime - startTime,
        responseBody: responseText,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (fetchError) {
      console.log(`Fetch API failed: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
      console.log(`Trying with axios as fallback...`);
      
      // If fetch fails, try with axios as fallback
      const axiosStartTime = Date.now();
      const axiosResponse = await axios.get(`${url}/rest/v1/`, {
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
          'X-Client-Info': `diagnostics/${Platform.OS}`,
        },
        timeout: 5000 // 5 second timeout for axios
      });
      const axiosEndTime = Date.now();
      
      console.log(`Axios Response: Status ${axiosResponse.status}, Time: ${axiosEndTime - axiosStartTime}ms`);
      
      return {
        success: axiosResponse.status >= 200 && axiosResponse.status < 300,
        statusCode: axiosResponse.status,
        responseTime: axiosEndTime - axiosStartTime,
        responseBody: JSON.stringify(axiosResponse.data),
        headers: axiosResponse.headers
      };
    }
  } catch (e) {
    console.error('All HTTP connection attempts failed:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e)
    };
  }
};

// Test TLS connectivity with timeout
const testTLSConnection = async (url: string): Promise<{
  success: boolean;
  error?: string;
  protocol?: string;
}> => {
  if (!url) return { success: false, error: 'No URL provided' };
  
  try {
    // Extract hostname from URL
    const hostname = new URL(url).hostname;
    console.log(`Testing TLS connection to hostname: ${hostname}`);
    
    // Create a promise that times out after 5 seconds
    const timeoutPromise = new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new Error('TLS connection test timed out after 5 seconds')), 5000);
    });
    
    // Use a HEAD request to check TLS with timeout
    const fetchPromise = fetch(`https://${hostname}`, {
      method: 'HEAD',
    });
    
    // Race the fetch against the timeout
    const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
    
    // Try to get protocol information
    const protocol = 'https'; // Simplified - in a real scenario we'd detect the actual TLS version
    
    return {
      success: true,
      protocol
    };
  } catch (e) {
    console.error('TLS connection test failed:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e)
    };
  }
};

// Check device and OS info
const getDeviceInfo = async () => {
  try {
    // Use the correct API methods available in expo-application
    const appVersion = Application.nativeApplicationVersion || 'unknown';
    const buildVersion = Application.nativeBuildVersion || 'unknown';
    const bundleId = Application.applicationId || 'unknown';
    
    return {
      platform: Platform.OS,
      osVersion: Platform.Version,
      appVersion,
      buildVersion,
      bundleId
    };
  } catch (e) {
    console.error('Failed to get device info:', e);
    return {
      platform: Platform.OS,
      osVersion: Platform.Version,
      error: e instanceof Error ? e.message : String(e)
    };
  }
};

// Check certificate pinning and ATS settings
const checkSecuritySettings = () => {
  const iosATSEnabled = Platform.OS === 'ios'; // Simplified check
  
  return {
    iosAppTransportSecurity: Platform.OS === 'ios' ? {
      enabled: iosATSEnabled,
      allowsArbitraryLoads: false, // This should match your app.json setting
      allowsExceptionDomains: true // This should match your app.json setting
    } : 'Not applicable',
    certificatePinningEnabled: false, // Depends on your implementation
  };
};

// Main diagnostic function
export const diagnoseSuapabaseConnection = async (): Promise<void> => {
  console.log('\n--- SUPABASE CONNECTION DIAGNOSIS ---');
  console.log('Timestamp:', new Date().toISOString());
  
  // Get device info
  console.log('\nDevice Information:');
  const deviceInfo = await getDeviceInfo();
  console.log(JSON.stringify(deviceInfo, null, 2));
  
  // Check environment variables
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('\nEnvironment Variables:');
  console.log('- URL defined:', !!supabaseUrl);
  if (supabaseUrl) {
    console.log('- URL value:', supabaseUrl);
  }
  console.log('- Anon Key defined:', !!supabaseAnonKey);
  if (supabaseAnonKey) {
    // Show only first 10 chars for security
    console.log('- Anon Key (partial):', `${supabaseAnonKey.substring(0, 10)}...`);
  }
  
  // Validate URL format
  if (supabaseUrl) {
    if (!isValidUrl(supabaseUrl)) {
      console.log('❌ Invalid Supabase URL format');
    } else {
      console.log('✅ Valid Supabase URL format');
    }
  } else {
    console.log('❌ Supabase URL is missing');
  }
  
  // Check security settings
  console.log('\nSecurity Settings:');
  const securitySettings = checkSecuritySettings();
  console.log(JSON.stringify(securitySettings, null, 2));
  
  // Check network connectivity
  console.log('\nChecking Network Connectivity:');
  const networkStatus = await checkNetworkConnectivity();
  console.log('- Connected to network:', networkStatus.isConnected ? 'Yes' : 'No');
  console.log('- Connection type:', networkStatus.connectionType);
  console.log('- Internet reachable:', networkStatus.isInternetReachable ? 'Yes' : 'No');
  console.log('- NetInfo details:', JSON.stringify(networkStatus.netInfoDetails, null, 2));
  
  if (!networkStatus.isConnected) {
    console.log('❌ No network connection available. Please check your device settings.');
    return;
  }
  
  // Check stored session
  console.log('\nChecking for Stored Session:');
  const storedSession = await getStoredSession();
  
  if (storedSession) {
    const expiresAt = storedSession.expires_at ? new Date(storedSession.expires_at * 1000) : null;
    const isExpired = expiresAt ? expiresAt < new Date() : true;
    
    if (isExpired) {
      console.log('⚠️ Stored session has expired at:', expiresAt?.toLocaleString());
    } else {
      console.log('✓ Valid session found for user:', storedSession.user?.email);
      console.log('- Expires at:', expiresAt?.toLocaleString());
    }
  } else {
    console.log('⚠️ No auth keys found in storage');
  }
  
  // Test TLS connection
  console.log('\nTesting TLS Connection:');
  if (supabaseUrl) {
    const tlsTest = await testTLSConnection(supabaseUrl);
    if (tlsTest.success) {
      console.log('✅ TLS connection successful');
      console.log('- Protocol:', tlsTest.protocol);
    } else {
      console.log('❌ TLS connection failed');
      console.log('- Error:', tlsTest.error);
    }
  }
  
  // Test direct HTTP connection
  console.log('\nTesting Direct HTTP Connection:');
  if (supabaseUrl) {
    const httpTest = await testNativeHttpConnection(supabaseUrl);
    if (httpTest.success) {
      console.log('✅ HTTP connection successful');
      console.log('- Response time:', httpTest.responseTime, 'ms');
      console.log('- Status code:', httpTest.statusCode);
    } else {
      console.log('❌ HTTP connection failed');
      console.log('- Error:', httpTest.error);
      console.log('- Status code:', httpTest.statusCode);
    }
  }
  
  // Try to access Supabase services
  console.log('\nTesting Supabase API Connection:');
  
  // Test ping time
  try {
    const startTime = Date.now();
    const response = await fetch(supabaseUrl || '', {
      method: 'HEAD',
      headers: { 'Cache-Control': 'no-cache' }
    });
    const pingTime = Date.now() - startTime;
    
    if (response.ok) {
      console.log('✅ Ping successful:', pingTime, 'ms');
    } else {
      console.log('❌ Ping failed with status:', response.status);
    }
  } catch (e) {
    console.log('❌ Cannot reach Supabase server:', e instanceof Error ? e.message : String(e));
  }
  
  // Test database connection
  try {
    console.log('\nTesting Database Connection:');
    const startTime = Date.now();
    const { data, error } = await supabase.from('recipes').select('count', { count: 'exact', head: true });
    const endTime = Date.now();
    
    if (error) {
      // Check if it's a permission error (which means connection works but permissions don't)
      if (error.code === 'PGRST301' || error.message.includes('permission denied')) {
        console.log('⚠️ Connection successful but permission issues detected');
        console.log('- The connection to Supabase is working, but the query is not authorized');
        console.log('- This is often normal when not logged in');
      } else {
        console.log('❌ Database connection failed:', error.message);
        console.log('- Error code:', error.code);
        console.log('- Error details:', JSON.stringify(error, null, 2));
      }
    } else {
      console.log(`✅ Database connection successful (${endTime - startTime}ms)`);
    }
  } catch (e) {
    console.log('❌ Database connection error:', e instanceof Error ? e.message : String(e));
  }
  
  // Check auth status
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ Auth check failed:', error.message);
    } else if (data.session) {
      console.log('✅ Auth session is active for user:', data.session.user.email);
    } else {
      console.log('⚠️ No active auth session');
    }
  } catch (e) {
    console.log('❌ Auth check error:', e instanceof Error ? e.message : String(e));
  }
  
  // Recommend solutions
  console.log('\nRecommendations:');
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('- Check your .env file and ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set correctly');
  }
  
  if (!networkStatus.isConnected || !networkStatus.isInternetReachable) {
    console.log('- Check your device internet connection');
  }
  
  console.log('- Ensure your Supabase project is active and not in maintenance mode');
  console.log('- Verify you have the correct permissions in your Supabase project');
  
  if (Platform.OS === 'ios') {
    console.log('- On iOS, check App Transport Security settings in app.json');
    console.log('- Try using a different network or cellular connection');
    console.log('- If using a VPN, try disabling it temporarily');
  }
  
  console.log('\n--- END OF DIAGNOSIS ---\n');
}; 