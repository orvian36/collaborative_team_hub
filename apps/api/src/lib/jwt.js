const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_SECRET || 'your-access-secret-change-me';
const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-me';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Generate an access token for a user
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

/**
 * Generate a refresh token for a user
 */
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
};

/**
 * Verify an access token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
};

/**
 * Verify a refresh token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_TOKEN_SECRET);
};

/**
 * Set HTTP-Only cookies for authentication
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'strict',
    path: '/api/auth/refresh', // Restrict path for better security
    maxAge: REFRESH_TOKEN_EXPIRY_MS,
  });
};

/**
 * Clear HTTP-Only authentication cookies
 */
const clearAuthCookies = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  const opts = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'strict',
  };
  res.clearCookie('accessToken', opts);
  res.clearCookie('refreshToken', { ...opts, path: '/api/auth/refresh' });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  REFRESH_TOKEN_EXPIRY_MS,
};
