#!/usr/bin/env node

/**
 * Get Supabase Auth Token Script
 *
 * This script uses your existing Supabase credentials to:
 * 1. Create a test user (if needed)
 * 2. Sign in and get a JWT token
 * 3. Output the token for use in testing
 */

require("dotenv").config();
const fetch = require("node-fetch");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("❌ Missing Supabase credentials in .env file");
  process.exit(1);
}

// Test user credentials
const TEST_USER = {
  email: "test@example.com",
  password: "TestPassword123!",
};

/**
 * Create a test user in Supabase
 */
async function createTestUser() {
  console.log("🔧 Creating test user...");

  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
        email_confirm: false, // Skip email confirmation for testing
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Test user created successfully");
      return data;
    } else if (data.msg && data.msg.includes("already registered")) {
      console.log("ℹ️  Test user already exists");
      return { user_exists: true };
    } else {
      console.log("⚠️  User creation response:", data);
      return { user_exists: true }; // Assume user exists and continue
    }
  } catch (error) {
    console.log(
      "⚠️  Error creating user (user might already exist):",
      error.message
    );
    return { user_exists: true };
  }
}

/**
 * Sign in and get JWT token
 */
async function getAuthToken() {
  console.log("🔑 Getting auth token...");

  try {
    const response = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: TEST_USER.email,
          password: TEST_USER.password,
        }),
      }
    );

    const data = await response.json();

    if (response.ok && data.access_token) {
      console.log("✅ Successfully obtained auth token!");
      console.log("");
      console.log("🎯 Your JWT Token:");
      console.log("==================");
      console.log(data.access_token);
      console.log("");
      console.log("📋 To use this token:");
      console.log(`export TEST_AUTH_TOKEN="${data.access_token}"`);
      console.log("node test-api-production.js");
      console.log("");
      console.log(
        "⏰ Token expires at:",
        new Date(data.expires_at * 1000).toISOString()
      );

      return data.access_token;
    } else {
      console.error("❌ Failed to get auth token:", data);
      return null;
    }
  } catch (error) {
    console.error("❌ Error getting auth token:", error.message);
    return null;
  }
}

/**
 * Test the token by making an API call
 */
async function testToken(token) {
  console.log("🧪 Testing token...");

  try {
    const response = await fetch("http://localhost:3000/api/auth/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Token works! User:", data.data?.user?.email);
      return true;
    } else {
      console.log("⚠️  Token test failed with status:", response.status);
      const errorData = await response.text();
      console.log("Response:", errorData);
      return false;
    }
  } catch (error) {
    console.log(
      "⚠️  Could not test token (server might not be running):",
      error.message
    );
    console.log("💡 Make sure your server is running: npm run dev");
    return true; // Don't fail if server is not running
  }
}

/**
 * Main function
 */
async function main() {
  console.log("🚀 Supabase Auth Token Generator");
  console.log("=================================");
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`);
  console.log(`👤 Test User: ${TEST_USER.email}`);
  console.log("");

  // Step 1: Create test user (if needed)
  await createTestUser();

  // Step 2: Get auth token
  const token = await getAuthToken();

  if (!token) {
    console.error("❌ Failed to obtain auth token");
    process.exit(1);
  }

  // Step 3: Test the token
  await testToken(token);

  console.log("");
  console.log("🎉 Done! Use the token above for testing.");
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  });
}

module.exports = { createTestUser, getAuthToken, testToken };
