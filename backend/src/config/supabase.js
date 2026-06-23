const { createClient } = require("@supabase/supabase-js");

// Validate required environment variables
if (!process.env.SUPABASE_URL) {
  console.warn(
    "Warning: SUPABASE_URL not configured. Some features will be disabled."
  );
}

if (!process.env.SUPABASE_ANON_KEY) {
  console.warn(
    "Warning: SUPABASE_ANON_KEY not configured. Some features will be disabled."
  );
}

// Create Supabase client
const supabase =
  process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
    ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: {
          headers: {
            "X-Client-Info": "recipe-backend-api/1.0.0",
          },
        },
      })
    : null;

// Create admin client for server-side operations
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    )
  : null;

// Helper function to verify JWT token
async function verifySupabaseToken(token) {
  if (!supabase) {
    throw new Error("Supabase not configured");
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }

    if (!user) {
      throw new Error("Invalid token: no user found");
    }

    return user;
  } catch (error) {
    throw new Error(`Token verification error: ${error.message}`);
  }
}

module.exports = {
  supabase,
  supabaseAdmin,
  verifySupabaseToken,
};
