/**
 * Authentication and Domain Verification Middleware
 * Strictly enforces that ONLY @gameopedia.com email addresses can sign up or access features.
 */

const ALLOWED_DOMAIN = 'gameopedia.com';

export function isGameopediaEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  const domainPart = trimmed.split('@')[1];
  return domainPart === ALLOWED_DOMAIN;
}

export function authMiddleware(req, res, next) {
  const userEmail = req.headers['x-user-email'] || req.body?.userEmail || req.query?.userEmail;

  if (!userEmail) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a Gameopedia work email.'
    });
  }

  if (!isGameopediaEmail(userEmail)) {
    return res.status(403).json({
      success: false,
      error: `Access Denied: Only accounts ending with @${ALLOWED_DOMAIN} are permitted to access Gameopedia Sports Portal.`
    });
  }

  req.user = {
    email: userEmail.trim().toLowerCase(),
    domain: ALLOWED_DOMAIN,
    isAdmin: userEmail.toLowerCase().includes('admin') || userEmail.toLowerCase() === 'aravind@gameopedia.com' || userEmail.toLowerCase() === 'david.miller@gameopedia.com'
  };

  next();
}

export function adminOnly(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Admin privilege required for this action.'
    });
  }
  next();
}
