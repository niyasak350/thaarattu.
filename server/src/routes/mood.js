const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/mood  - last 30 entries of the logged-in user
router.get('/', async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM mood_logs WHERE user_id = ? ORDER BY log_date DESC LIMIT 30', [req.user.id]);
  res.json(rows.reverse());
});

// POST /api/mood  - save today's mood (saving again on the same day updates it)
router.post('/', async (req, res) => {
  const mood = Number(req.body.mood), stress = Number(req.body.stress);
  const ok = (n) => Number.isInteger(n) && n >= 1 && n <= 5;
  if (!ok(mood) || !ok(stress)) return res.status(400).json({ error: 'Mood and stress must be 1 to 5' });
  await db.query(
    `INSERT INTO mood_logs (user_id, log_date, mood, stress, note) VALUES (?, CURDATE(), ?, ?, ?)
     ON DUPLICATE KEY UPDATE mood = VALUES(mood), stress = VALUES(stress), note = VALUES(note)`,
    [req.user.id, mood, stress, req.body.note || null]);
  res.json({ ok: true });
});

// POST /api/mood/feedback  - message to admin
router.post('/feedback', async (req, res) => {
  if (!req.body.message) return res.status(400).json({ error: 'Message is required' });
  await db.query('INSERT INTO feedback (user_id, message) VALUES (?, ?)',
    [req.user.id, req.body.message]);
  res.json({ ok: true });
});

module.exports = router;
