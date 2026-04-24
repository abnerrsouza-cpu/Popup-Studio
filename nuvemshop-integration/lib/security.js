// lib/security.js
// Security headers e utilidades de proteção.

export function setSecurityHeaders(res) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
}

export function setCorsRestricted(res) {
  var appUrl = process.env.APP_URL || 'https://popup-studio.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', appUrl);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

export function safeErrorMessage(err) {
  if (process.env.NODE_ENV === 'development') return err.message || 'Internal error';
  return 'Internal server error';
}
