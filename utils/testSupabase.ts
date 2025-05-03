import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * This utility is for testing Supabase connection issues in isolation.
 * It creates a minimal Supabase client and attempts to make a connection.
 * 
 * Usage:
 * 1. Import this file in your component
 * 2. Call testSupabaseConnection() and check the console logs
 */

export async function testSupabaseConnection() {
  console.log('==== 🧪 SUPABASE CONNECTION TEST ====');
  
  try {
    // Log environment variables
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log(`🔍 URL: ${supabaseUrl ? '✓ defined' : '✗ undefined'}`);
    console.log(`🔑 Key: ${supabaseKey ? '✓ defined' : '✗ undefined'}`);
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Environment variables are missing');
    }
    
    console.log(`🔐 Key (partial): ${supabaseKey.substring(0, 8)}...${supabaseKey.substring(supabaseKey.length - 5)}`);
    
    // Create a minimal Supabase client
    console.log('📝 Creating minimal Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'X-Client-Info': `react-native-test/${Platform.OS}`,
        },
      },
    });
    
    // Test a simple query
    console.log('🔄 Testing simple query...');
    const start = Date.now();
    const { data, error, status } = await supabase.from('profiles').select('id').limit(1);
    const end = Date.now();
    
    console.log(`⏱️ Query response time: ${end - start}ms`);
    console.log(`📊 Status: ${status}`);
    
    if (error) {
      console.error('❌ Query failed:', error);
      
      // Special handling for authentication errors
      if (status === 401 || status === 403) {
        console.error('🚫 Authentication error. Your API key may be invalid or expired.');
        console.log('🔑 Expected format for anon key: "eyJ..." (JWT format)');
        
        // Try to validate key format
        if (supabaseKey && !supabaseKey.startsWith('eyJ')) {
          console.error('🚨 API key format appears invalid. Supabase keys should start with "eyJ"');
        }
      }
      
      // Check for "profiles" table not existing
      if (error.message && error.message.includes('does not exist')) {
        console.error('📋 The "profiles" table does not exist in your database.');
        console.log('💡 Run the SQL from the README.md file to create the necessary tables.');
      }
      
      return { success: false, error, status };
    }
    
    console.log(`✅ Query successful! Received ${data?.length || 0} records`);
    return { success: true, data, status };
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  } finally {
    console.log('==== 🧪 TEST COMPLETE ====');
  }
}

// Direct test function for CLI usage
export async function runSupabaseTest() {
  const result = await testSupabaseConnection();
  return result;
}

// If this file is run directly (e.g. with node)
if (typeof require !== 'undefined' && require.main === module) {
  runSupabaseTest()
    .then(result => {
      console.log('Test result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test failed with uncaught error:', error);
      process.exit(1);
    });
} 