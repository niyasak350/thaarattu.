// Helpers for making logins for doctors and hospital administrators.
// (Parents register themselves; these accounts are made for them by an admin.)
const bcrypt = require('bcryptjs');
const db = require('./db');

// Returns { error } or { id } of the new user
async function createLogin({ name, email, password, role }) {
  if (!name || !email || !password) return { error: 'Login name, email and password are required' };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Please enter a valid login email' };
  if (password.length < 6) return { error: 'The login password must be at least 6 characters' };
  const [taken] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (taken.length) return { error: 'An account with that email already exists' };
  const [result] = await db.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, await bcrypt.hash(password, 10), role]);
  return { id: result.insertId };
}

async function setPassword(userId, password) {
  if (password.length < 6) return { error: 'The login password must be at least 6 characters' };
  await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(password, 10), userId]);
  return {};
}

module.exports = { createLogin, setPassword };
