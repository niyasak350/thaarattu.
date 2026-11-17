const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

// Security answers are compared without caring about capitals or extra spaces
const cleanAnswer = (text) => String(text || '').trim().toLowerCase();
const hashAnswer = (text) => bcrypt.hash(cleanAnswer(text), 10);

function makeToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register  - new parent account
router.post('/register', async (req, res) => {
  const { name, email, password, security_question, security_answer } = req.body;
  if (!name || !email || !password || !security_question || !security_answer) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Please enter a valid email address' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (exists.length) return res.status(400).json({ error: 'Email already registered' });

  const hash = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    `INSERT INTO users (name, email, password_hash, security_question, security_answer_hash)
     VALUES (?, ?, ?, ?, ?)`, [name, email, hash, security_question, await hashAnswer(security_answer)]);
  const user = { id: result.insertId, name, email, role: 'parent' };
  res.json({ token: makeToken(user), user });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email || '']);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password || '', user.password_hash))) {
    return res.status(400).json({ error: 'Wrong email or password' });
  }
  if (user.is_blocked) return res.status(403).json({ error: 'Your account is blocked' });
  // The login page asks "Parent, Doctor or Hospital admin". Tell people if they picked the wrong one.
  const names = { parent: 'Parent', doctor: 'Doctor', hospital_admin: 'Hospital admin' };
  const chosen = req.body.role;
  if (names[chosen] && user.role !== chosen && user.role !== 'admin') {
    return res.status(400).json({ error: `This is a ${names[user.role]} account. Choose "${names[user.role]}" above and try again.` });
  }
  res.json({
    token: makeToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// GET /api/auth/me  - who is logged in
router.get('/me', requireLogin, (req, res) => res.json({ user: req.user }));

// ---------- Forgot password (security question) ----------

// POST /api/auth/forgot/question  - body: { email }  ->  { question }
router.post('/forgot/question', async (req, res) => {
  const [rows] = await db.query('SELECT security_question FROM users WHERE email = ?', [req.body.email || '']);
  if (!rows.length || !rows[0].security_question) {
    return res.status(400).json({ error: 'No account found with that email' });
  }
  res.json({ question: rows[0].security_question });
});

// POST /api/auth/forgot/reset  - body: { email, answer, password }
router.post('/forgot/reset', async (req, res) => {
  const { email, answer, password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  const [rows] = await db.query('SELECT id, security_answer_hash FROM users WHERE email = ?', [email || '']);
  const user = rows[0];
  if (!user || !user.security_answer_hash || !(await bcrypt.compare(cleanAnswer(answer), user.security_answer_hash))) {
    return res.status(400).json({ error: 'That answer is not correct' });
  }
  await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(password, 10), user.id]);
  res.json({ ok: true });
});

// PUT /api/auth/security  - change the security question (needs the current password)
router.put('/security', requireLogin, async (req, res) => {
  const { current, security_question, security_answer } = req.body;
  if (!security_question || !security_answer) return res.status(400).json({ error: 'Question and answer are required' });
  const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  if (!(await bcrypt.compare(current || '', rows[0].password_hash))) {
    return res.status(400).json({ error: 'Current password is wrong' });
  }
  await db.query('UPDATE users SET security_question = ?, security_answer_hash = ? WHERE id = ?',
    [security_question, await hashAnswer(security_answer), req.user.id]);
  res.json({ ok: true });
});

// PUT /api/auth/profile  - change name
router.put('/profile', requireLogin, async (req, res) => {
  const name = (req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: 'Name is required' });
  await db.query('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
  res.json({ user: { ...req.user, name } });
});

// PUT /api/auth/password  - body: { current, next }
router.put('/password', requireLogin, async (req, res) => {
  const { current, next } = req.body;
  if (!next || next.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
  const [rows] = await db.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
  if (!(await bcrypt.compare(current || '', rows[0].password_hash))) {
    return res.status(400).json({ error: 'Current password is wrong' });
  }
  await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(next, 10), req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
