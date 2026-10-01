const pool = require('../config/db');
const redis = require('../config/redis');
const { comparePassword } = require('../utils/password');
const { signToken, expiryToSeconds } = require('../utils/jwt');
const { auditLog } = require('../utils/audit');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/auth/login
 * Accepts: { username, password }
 * Returns: { token, user }
 */
async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const userRes = await pool.query(
    `SELECT u.*, s.school_name, s.block_name, s.district_name
     FROM sd_users u
     LEFT JOIN sd_schools s ON s.udise_code = u.primary_udise
     WHERE u.username = $1`,
    [username.trim().toLowerCase()]
  );

  if (!userRes.rowCount) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const user = userRes.rows[0];

  if (!user.is_active) {
    return res.status(403).json({ error: 'Your account has been deactivated. Please contact the administrator.' });
  }

  const passwordValid = await comparePassword(password, user.password_hash);
  if (!passwordValid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Invalidate any existing session (single-session enforcement)
  const jti = uuidv4();
  const ttl = expiryToSeconds(process.env.JWT_EXPIRES_IN || '12h');

  await redis.set(`session:${user.id}`, jti, 'EX', ttl);

  const token = signToken({
    jti,
    user_id: user.id,
    username: user.username,
    full_name: user.full_name,
    role: user.role,
    primary_udise: user.primary_udise,
    scope_type: user.scope_type,
    scope_value: user.scope_value,
  });

  // Update last login
  await pool.query(
    `UPDATE sd_users SET last_login_at = now() WHERE id = $1`,
    [user.id]
  );

  await auditLog({
    userId: user.id,
    username: user.username,
    action: 'LOGIN',
    entityType: 'user',
    entityId: user.id,
    req,
  });

  // Get active year assignments for immediate frontend hydration
  const assignRes = await pool.query(
    `SELECT ta.id, ta.school_udise, ta.class_id,
            c.class_name, c.class_num,
            s.school_name,
            ay.year_label,
            ay.is_active AS year_is_active,
            (SELECT COUNT(*) FROM sd_students st
             WHERE st.school_udise = ta.school_udise
               AND st.class_id = ta.class_id
               AND st.academic_year_id = ta.academic_year_id
               AND st.is_active = true) AS student_count
     FROM sd_teacher_assignments ta
     JOIN sd_classes c ON c.id = ta.class_id
     JOIN sd_schools s ON s.udise_code = ta.school_udise
     JOIN sd_academic_years ay ON ay.id = ta.academic_year_id
     WHERE ta.user_id = $1 AND ta.is_active = true
     ORDER BY ay.is_active DESC, c.class_num`,
    [user.id]
  );

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
      primary_udise: user.primary_udise,
      school_name: user.school_name,
      block_name: user.block_name,
      district_name: user.district_name,
      scope_type: user.scope_type,
      scope_value: user.scope_value,
    },
    assignments: assignRes.rows,
  });
}


/**
 * POST /api/auth/logout
 */
async function logout(req, res) {
  if (req.user) {
    await redis.del(`session:${req.user.id}`);
    await auditLog({
      userId: req.user.id,
      username: req.user.username,
      action: 'LOGOUT',
      entityType: 'user',
      entityId: req.user.id,
      req,
    });
  }
  res.json({ message: 'Logged out successfully' });
}

/**
 * GET /api/auth/me
 * Returns current user profile + active academic year assignments
 */
async function me(req, res) {
  const userId = req.user.id;

  const userRes = await pool.query(
    `SELECT u.id, u.username, u.full_name, u.email, u.mobile, u.role,
            u.primary_udise, u.scope_type, u.scope_value,
            u.last_login_at, u.created_at,
            s.school_name, s.block_name, s.district_name, s.cluster_name,
            s.latitude, s.longitude, s.hos_name
     FROM sd_users u
     LEFT JOIN sd_schools s ON s.udise_code = u.primary_udise
     WHERE u.id = $1`,
    [userId]
  );

  if (!userRes.rowCount) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = userRes.rows[0];

  // Get active year assignments
  const assignRes = await pool.query(
    `SELECT ta.id, ta.school_udise, ta.class_id,
            c.class_name, c.class_num,
            s.school_name,
            ay.year_label,
            ay.is_active AS year_is_active,
            (SELECT COUNT(*) FROM sd_students st
             WHERE st.school_udise = ta.school_udise
               AND st.class_id = ta.class_id
               AND st.academic_year_id = ta.academic_year_id
               AND st.is_active = true) AS student_count
     FROM sd_teacher_assignments ta
     JOIN sd_classes c ON c.id = ta.class_id
     JOIN sd_schools s ON s.udise_code = ta.school_udise
     JOIN sd_academic_years ay ON ay.id = ta.academic_year_id
     WHERE ta.user_id = $1 AND ta.is_active = true
     ORDER BY ay.is_active DESC, c.class_num`,
    [userId]
  );

  return res.json({
    user,
    assignments: assignRes.rows,
  });
}

module.exports = { login, logout, me };
