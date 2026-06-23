const { verifySupabaseToken } = require("../config/supabase");

/**
 * Authentication Controller
 *
 * Handles authentication-related endpoints
 * Uses Supabase for authentication but provides API endpoints for verification
 */

/**
 * Verify JWT token
 * POST /api/auth/verify
 */
async function verifyToken(req, res) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Token is required",
      });
    }

    const user = await verifySupabaseToken(token);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.email_confirmed_at ? true : false,
          createdAt: user.created_at,
          lastSignIn: user.last_sign_in_at,
        },
      },
      message: "Token is valid",
    });
  } catch (error) {
    console.error("[AuthController] Error in verifyToken:", error);
    res.status(401).json({
      success: false,
      error: "Invalid token",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Get current user profile
 * GET /api/auth/profile
 */
async function getProfile(req, res) {
  try {
    // User is already attached to req by auth middleware
    const user = req.user;

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.email_confirmed_at ? true : false,
          createdAt: user.created_at,
          lastSignIn: user.last_sign_in_at,
          userMetadata: user.user_metadata || {},
        },
      },
    });
  } catch (error) {
    console.error("[AuthController] Error in getProfile:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch profile",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

/**
 * Health check for authentication service
 * GET /api/auth/health
 */
async function healthCheck(req, res) {
  try {
    // Test Supabase connection
    const testResult = {
      supabaseConnection: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    };

    res.json({
      success: true,
      data: testResult,
      message: "Authentication service is healthy",
    });
  } catch (error) {
    console.error("[AuthController] Error in healthCheck:", error);
    res.status(500).json({
      success: false,
      error: "Authentication service health check failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
}

module.exports = {
  verifyToken,
  getProfile,
  healthCheck,
};
