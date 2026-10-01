const { verifyToken } = require('../utils/jwt');
const redis = require('../config/redis');
const asyncHandler = require('../utils/asyncHandler');

/**
 * authenticate: Validates JWT Bearer token and populates req.user.
 * Session is stored in Redis (key: session:<user_id>) for single-session enforcement.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Check active session in Redis / fallback store
  const activeJti = await redis.get(`session:${payload.user_id}`);
  if (activeJti && activeJti !== payload.jti) {
    return res.status(401).json({ error: 'Session superseded, please log in again' });
  }

  // If session key is absent (e.g. dev server restarted) but JWT signature is verified and valid, re-seed it
  if (!activeJti && payload.jti) {
    await redis.set(`session:${payload.user_id}`, payload.jti, 'EX', 43200);
  }

  req.user = {
    id: payload.user_id,
    username: payload.username,
    full_name: payload.full_name,
    role: payload.role,
    primary_udise: payload.primary_udise,
    scope_type: payload.scope_type,
    scope_value: payload.scope_value,
  };

  next();
});

module.exports = authenticate;
