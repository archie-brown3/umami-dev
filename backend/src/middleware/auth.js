const { verifySupabaseToken } = require('../config/supabase');

/**
 * Authentication middleware for protecting routes
 * Validates Supabase JWT tokens from Authorization header
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Access denied. No authorization header provided.' 
      });
    }
    
    // Check for Bearer token format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Access denied. Invalid authorization header format.' 
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }
    
    // Verify token with Supabase
    const user = await verifySupabaseToken(token);
    
    // Add user to request object for use in route handlers
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({ 
      error: 'Invalid token.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user to request if token is valid, but doesn't block access
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        try {
          const user = await verifySupabaseToken(token);
          req.user = user;
          req.token = token;
        } catch (error) {
          // Silently fail for optional auth
          console.log('Optional auth failed:', error.message);
        }
      }
    }
    
    next();
  } catch (error) {
    // Don't block request for optional auth errors
    console.error('Optional authentication error:', error.message);
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuth
};

