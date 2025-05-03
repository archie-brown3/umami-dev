import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, AuthFlowType } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'
import * as Network from 'expo-network'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

const isIOS = Platform.OS === 'ios'

// Add custom fetch interceptor for logging
const loggedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const requestStartTime = Date.now()
  
  // Log the request attempt
  console.log(`🌐 [Supabase Request] ${init?.method || 'GET'} ${typeof input === 'string' ? input : input.toString()}`)
  
  // Check network connectivity before making the request
  try {
    const networkState = await Network.getNetworkStateAsync()
    console.log(`🌐 [Network Status] Connected: ${networkState.isConnected ? 'Yes' : 'No'}, Type: ${networkState.type}, Internet Reachable: ${networkState.isInternetReachable ? 'Yes' : 'No'}`)
    
    if (!networkState.isConnected) {
      console.log('❌ [Network Error] No network connection available')
      return new Response(JSON.stringify({ error: 'No network connection' }), { status: 0 })
    }
  } catch (error) {
    console.log(`⚠️ [Network Check Error] ${error instanceof Error ? error.message : String(error)}`)
  }
  
  // Make the actual request with detailed error handling
  try {
    const response = await fetch(input, init)
    const requestDuration = Date.now() - requestStartTime
    
    // Log response details
    console.log(`✅ [Supabase Response] Status: ${response.status}, Time: ${requestDuration}ms`)
    
    // If not OK, try to log the response body for debugging
    if (!response.ok) {
      try {
        // Clone the response so we can still return the original
        const clonedResponse = response.clone()
        const body = await clonedResponse.text()
        console.log(`❌ [Supabase Error Response] ${body}`)
      } catch (err) {
        console.log(`❌ [Response Parsing Error] ${err instanceof Error ? err.message : String(err)}`)
      }
    }
    
    return response
  } catch (error) {
    const requestDuration = Date.now() - requestStartTime
    console.log(`❌ [Fetch Error] ${error instanceof Error ? error.message : String(error)}, Time: ${requestDuration}ms`)
    throw error
  }
}

// Set up logging functions
const setupDebugLogging = () => {
  // Intercept console methods to add context
  const originalDebug = console.debug
  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error

  // Only override in development
  if (__DEV__) {
    console.debug = (...args) => originalDebug('🔵 [Supabase Debug]', ...args)
    console.log = (...args) => originalLog('🔷 [Supabase Log]', ...args)
    console.warn = (...args) => originalWarn('⚠️ [Supabase Warning]', ...args)
    console.error = (...args) => originalError('❌ [Supabase Error]', ...args)
  }
}

// Initialize enhanced logging if in development
if (__DEV__) {
  setupDebugLogging()
}

// Client configuration with platform-specific settings
const options = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: "pkce" as AuthFlowType,
    storage: AsyncStorage,
    storageKey: "recipe-saver-auth-token",
    debug: __DEV__,
    timeout: isIOS ? 90000 : 30000, // Longer timeout for iOS
  },
  global: {
    fetch: loggedFetch,
    headers: {
      "X-Client-Info": `RecipeSaver/${isIOS ? "iOS" : "app"} @1.0.0`,
      "Content-Type": "application/json",
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, options)

// Log configuration for debugging
if (__DEV__) {
  console.log('----------- SUPABASE CONFIG -----------')
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Key defined:', !!supabaseAnonKey)
  console.log('Supabase Key (partial):', supabaseAnonKey.substring(0, 10) + '...')
  console.log('--------------------------------------')
  console.log('Running on platform:', Platform.OS, Platform.Version)
}

// Check for TLS version and platform
console.log(`Running on platform: ${Platform.OS} ${Platform.Version}`) 