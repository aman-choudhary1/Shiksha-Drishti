const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

function expiryToSeconds(exp) {
  const match = String(exp).match(/^(\d+)([smhd])$/);
  if (!match) return 43200;
  const n = Number(match[1]);
  const unit = match[2];
  return unit === 's' ? n : unit === 'm' ? n * 60 : unit === 'h' ? n * 3600 : n * 86400;
}

module.exports = { signToken, verifyToken, expiryToSeconds };
