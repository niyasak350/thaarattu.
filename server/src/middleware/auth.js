const jwt = require('jsonwebtoken');
const db = require('../db');

// Checks the "Authorization: Bearer <token>" header and loads the user
async function requireLogin(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Please log in' });
  try {
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await db.query(
      'SELECT id, name, email, role, is_blocked FROM users WHERE id = ?', [id]);
    if (!rows.length) return res.status(401).json({ error: 'Please log in' });
    if (rows[0].is_blocked) return res.status(403).json({ error: 'Your account is blocked' });
    req.user = rows[0];
    next();
  } catch (err) {
    res.status(401).json({ error: 'Please log in again' });
  }
}

// Use after requireLogin on admin-only routes
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only' });
  next();
}

// Use after requireLogin: only the given roles may continue.  e.g. requireRole('doctor')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'This page is not for your account type' });
    next();
  };
}

module.exports = { requireLogin, requireAdmin, requireRole };
