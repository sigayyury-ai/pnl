const express = require('express');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const router = express.Router();

// Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const ALLOWED_EMAILS = process.env.ALLOWED_EMAILS ? process.env.ALLOWED_EMAILS.split(',') : [];

// Google OAuth client
let googleClient = null;
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
}

/**
 * Middleware to check authentication status
 */
function checkAuth(req, res, next) {
  // Более надежное определение DEV_MODE
  const isLocalhost = req.get('host')?.includes('localhost') || 
                     req.get('host')?.includes('127.0.0.1') ||
                     process.env.NODE_ENV === 'development';
  
  const DEV_MODE = process.env.DEV_MODE === 'true' || 
                   process.env.DEV_MODE === true ||
                   isLocalhost;
  
  console.log('🔍 Auth check:', {
    NODE_ENV: process.env.NODE_ENV,
    DEV_MODE: process.env.DEV_MODE,
    computed_DEV_MODE: DEV_MODE,
    isLocalhost: isLocalhost,
    host: req.get('host'),
    path: req.path,
    method: req.method
  });
  
  if (DEV_MODE) {
    console.log('✅ DEV_MODE: пропускаем проверку авторизации для', req.method, req.path);
    return next();
  }

  console.log('PRODUCTION: проверяем авторизацию для', req.method, req.path);
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('PRODUCTION: отсутствует Authorization header');
    return res.status(401).json({ success: false, error: 'Authorization header required' });
  }

  // Extract token from header
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    // For now, we'll accept any token format since we're using Google OAuth
    // In production, you might want to verify this is a valid JWT
    if (!token || token.length < 10) {
      return res.status(401).json({ success: false, error: 'Invalid token format' });
    }
    
    // Store token in request for potential future use
    req.userToken = token;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ success: false, error: 'Token verification failed' });
  }
}

/**
 * Verify Google OAuth token
 */
async function verifyGoogleToken(token) {
  if (!googleClient) {
    throw new Error('Google OAuth not configured');
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const email = payload.email;
    
    // Check if email is allowed
    if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email)) {
      throw new Error(`Email ${email} is not in allowed list`);
    }
    
    return {
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      sub: payload.sub
    };
  } catch (error) {
    console.error('Google token verification failed:', error);
    throw new Error('Invalid Google token');
  }
}

/**
 * POST /api/auth/google
 * Handle Google OAuth callback
 */
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    if (!credential) {
      return res.status(400).json({ success: false, error: 'Credential required' });
    }
    
    const userInfo = await verifyGoogleToken(credential);
    
    // TODO: Create session or JWT token
    const sessionToken = `jwt_${Date.now()}_${Math.random()}`;
    
    res.json({
      success: true,
      user: userInfo,
      token: sessionToken
    });
    
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/config
 * Get authentication configuration for frontend
 */
router.get('/config', (req, res) => {
  res.json({
    googleClientId: GOOGLE_CLIENT_ID || '',
    allowedEmails: ALLOWED_EMAILS
  });
});

module.exports = {
  router,
  checkAuth,
  verifyGoogleToken
};
