// Mother wellness: weekly screening, sleep & recovery tracker, self-care planner
const express = require('express');
const db = require('../db');

const router = express.Router();
const isDate = (text) => /^\d{4}-\d{2}-\d{2}$/.test(text || '');

// ---------- Weekly wellbeing screening ----------

// GET /api/wellness/screenings
router.get('/screenings', async (req, res) => {
  const [rows] = await db.query(
    'SELECT id, taken_on, score FROM screenings WHERE user_id = ? ORDER BY taken_on, id', [req.user.id]);
  res.json(rows);
});

// POST /api/wellness/screenings  - body: { answers: [0-3, ... 10 numbers] }
// Only the total score is saved. The individual answers are not stored.
router.post('/screenings', async (req, res) => {
  const answers = req.body.answers;
  const valid = Array.isArray(answers) && answers.length === 10 &&
    answers.every((a) => Number.isInteger(a) && a >= 0 && a <= 3);
  if (!valid) return res.status(400).json({ error: 'Please answer all 10 questions' });
  const score = answers.reduce((sum, a) => sum + a, 0);
  await db.query('INSERT INTO screenings (user_id, taken_on, score) VALUES (?, CURDATE(), ?)',
    [req.user.id, score]);
  res.json({ score });
});

// ---------- Sleep & recovery ----------

// GET /api/wellness/sleep  - last 30 entries
router.get('/sleep', async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM sleep_logs WHERE user_id = ? ORDER BY log_date DESC LIMIT 30', [req.user.id]);
  res.json(rows.reverse());
});

// POST /api/wellness/sleep  - saving again for the same date updates it
router.post('/sleep', async (req, res) => {
  const { log_date, note } = req.body;
  const hours = Number(req.body.sleep_hours), energy = Number(req.body.energy), pain = Number(req.body.pain);
  const ok = (n) => Number.isInteger(n) && n >= 1 && n <= 5;
  if (!isDate(log_date) || !(hours >= 0 && hours <= 24) || !ok(energy) || !ok(pain)) {
    return res.status(400).json({ error: 'Please fill date, sleep hours, energy and pain' });
  }
  await db.query(
    `INSERT INTO sleep_logs (user_id, log_date, sleep_hours, energy, pain, note) VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE sleep_hours = VALUES(sleep_hours), energy = VALUES(energy),
       pain = VALUES(pain), note = VALUES(note)`,
    [req.user.id, log_date, hours, energy, pain, note || null]);
  res.json({ ok: true });
});

// ---------- Self-care planner ----------

// GET /api/wellness/selfcare?date=YYYY-MM-DD  - tasks ticked that day + last 7 days count
router.get('/selfcare', async (req, res) => {
  if (!isDate(req.query.date)) return res.status(400).json({ error: 'Date is required' });
  const [done] = await db.query(
    'SELECT task FROM selfcare_done WHERE user_id = ? AND log_date = ?', [req.user.id, req.query.date]);
  const [week] = await db.query(
    `SELECT log_date, COUNT(*) AS count FROM selfcare_done
     WHERE user_id = ? AND log_date > DATE_SUB(?, INTERVAL 7 DAY) AND log_date <= ?
     GROUP BY log_date ORDER BY log_date`, [req.user.id, req.query.date, req.query.date]);
  res.json({ done: done.map((d) => d.task), week });
});

// POST /api/wellness/selfcare  - body: { date, task, done: true/false }
router.post('/selfcare', async (req, res) => {
  const { date, task, done } = req.body;
  if (!isDate(date) || !task) return res.status(400).json({ error: 'Date and task are required' });
  if (done) {
    await db.query('INSERT IGNORE INTO selfcare_done (user_id, log_date, task) VALUES (?, ?, ?)',
      [req.user.id, date, task]);
  } else {
    await db.query('DELETE FROM selfcare_done WHERE user_id = ? AND log_date = ? AND task = ?',
      [req.user.id, date, task]);
  }
  res.json({ ok: true });
});

// ---------- Journal (private diary) ----------

router.get('/journal', async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM journal_entries WHERE user_id = ? ORDER BY entry_date DESC, id DESC LIMIT 60', [req.user.id]);
  res.json(rows);
});

router.post('/journal', async (req, res) => {
  const text = (req.body.text || '').trim();
  if (!isDate(req.body.entry_date) || !text) return res.status(400).json({ error: 'Please write something first' });
  await db.query('INSERT INTO journal_entries (user_id, entry_date, text) VALUES (?, ?, ?)',
    [req.user.id, req.body.entry_date, text.slice(0, 2000)]);
  res.json({ ok: true });
});

router.delete('/journal/:id', async (req, res) => {
  await db.query('DELETE FROM journal_entries WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
