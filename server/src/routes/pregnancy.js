// Pregnancy tracker: due date, week-by-week guide, check-up dates, kick counter, contraction timer
const express = require('express');
const db = require('../db');

const router = express.Router();
const DAY = 24 * 60 * 60 * 1000;
const isDate = (text) => /^\d{4}-\d{2}-\d{2}$/.test(text || '');
const toDate = (text) => new Date(text + 'T00:00:00Z');
const toText = (date) => date.toISOString().slice(0, 10);
const addDays = (text, days) => toText(new Date(toDate(text).getTime() + days * DAY));

function todayText() {
  const d = new Date();
  return toText(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));
}

// Adds week number, trimester, due date and progress to a pregnancy row
function withDetails(p) {
  const daysPregnant = Math.round((toDate(todayText()) - toDate(p.lmp_date)) / DAY);
  const week = Math.min(42, Math.max(1, Math.floor(daysPregnant / 7) + 1));
  const dueDate = addDays(p.lmp_date, 280);
  return {
    ...p,
    due_date: dueDate,
    week,
    day_of_week: ((daysPregnant % 7) + 7) % 7,
    trimester: week <= 13 ? 1 : week <= 27 ? 2 : 3,
    days_left: Math.round((toDate(dueDate) - toDate(todayText())) / DAY),
    progress: Math.min(100, Math.max(0, Math.round((daysPregnant / 280) * 100))),
  };
}

async function activePregnancy(userId) {
  const [rows] = await db.query(
    `SELECT * FROM pregnancies WHERE user_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`, [userId]);
  return rows[0] || null;
}

// GET /api/pregnancy  - the active pregnancy with this week's guide, or null
router.get('/', async (req, res) => {
  const p = await activePregnancy(req.user.id);
  if (!p) return res.json(null);
  const details = withDetails(p);
  const [guides] = await db.query(
    'SELECT * FROM pregnancy_guides WHERE ? BETWEEN week_from AND week_to ORDER BY week_from LIMIT 1',
    [details.week]);
  res.json({ ...details, guide: guides[0] || null });
});

// POST /api/pregnancy  - body: { lmp_date } or { due_date }. Creates or updates the active pregnancy.
router.post('/', async (req, res) => {
  let lmp = req.body.lmp_date;
  if (!lmp && isDate(req.body.due_date)) lmp = addDays(req.body.due_date, -280);
  if (!isDate(lmp)) return res.status(400).json({ error: 'Please enter your last period date or your due date' });
  const days = Math.round((toDate(todayText()) - toDate(lmp)) / DAY);
  if (days < 0 || days > 44 * 7) return res.status(400).json({ error: 'That date does not look right. Please check it.' });

  const current = await activePregnancy(req.user.id);
  if (current) await db.query('UPDATE pregnancies SET lmp_date = ? WHERE id = ?', [lmp, current.id]);
  else await db.query('INSERT INTO pregnancies (user_id, lmp_date) VALUES (?, ?)', [req.user.id, lmp]);
  res.json({ ok: true });
});

// POST /api/pregnancy/complete  - the baby is born (or the tracker is no longer needed)
router.post('/complete', async (req, res) => {
  await db.query(`UPDATE pregnancies SET status = 'completed' WHERE user_id = ? AND status = 'active'`, [req.user.id]);
  res.json({ ok: true });
});

// GET /api/pregnancy/guides  - all weeks, for browsing
router.get('/guides', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM pregnancy_guides ORDER BY week_from');
  res.json(rows);
});

// GET /api/pregnancy/foods
router.get('/foods', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM pregnancy_foods ORDER BY kind, trimester, id');
  res.json(rows);
});

// ---------- Check-ups ----------

// A typical antenatal schedule: [week of pregnancy, title]. Used by "Suggest check-ups".
const TYPICAL_CHECKUPS = [
  [8, 'First antenatal visit and dating scan'],
  [12, 'NT scan and first blood tests'],
  [16, 'Routine antenatal check-up'],
  [20, 'Anomaly (detailed) scan'],
  [24, 'Routine antenatal check-up'],
  [26, 'Glucose (sugar) test'],
  [28, 'Routine check-up and blood tests'],
  [32, 'Growth scan and check-up'],
  [34, 'Routine antenatal check-up'],
  [36, 'Check-up: baby position and birth plan'],
  [38, 'Weekly check-up'],
  [39, 'Weekly check-up'],
  [40, 'Due date check-up'],
];

router.get('/checkups', async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM checkups WHERE user_id = ? ORDER BY checkup_date, checkup_time', [req.user.id]);
  res.json(rows);
});

function checkupValues(b) {
  if (!b.title || !isDate(b.checkup_date)) return { error: 'Title and date are required' };
  const time = /^\d{2}:\d{2}$/.test(b.checkup_time || '') ? b.checkup_time : null;
  return { values: [b.title, b.checkup_date, time, b.place || null, b.notes || null] };
}

router.post('/checkups', async (req, res) => {
  const { error, values } = checkupValues(req.body);
  if (error) return res.status(400).json({ error });
  await db.query(
    'INSERT INTO checkups (title, checkup_date, checkup_time, place, notes, user_id) VALUES (?, ?, ?, ?, ?, ?)',
    [...values, req.user.id]);
  res.json({ ok: true });
});

router.put('/checkups/:id', async (req, res) => {
  const { error, values } = checkupValues(req.body);
  if (error) return res.status(400).json({ error });
  await db.query(
    `UPDATE checkups SET title = ?, checkup_date = ?, checkup_time = ?, place = ?, notes = ?, done = ?
     WHERE id = ? AND user_id = ?`, [...values, req.body.done ? 1 : 0, req.params.id, req.user.id]);
  res.json({ ok: true });
});

router.delete('/checkups/:id', async (req, res) => {
  await db.query('DELETE FROM checkups WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

// POST /api/pregnancy/checkups/suggest  - adds the typical schedule (future dates only, no duplicates)
router.post('/checkups/suggest', async (req, res) => {
  const p = await activePregnancy(req.user.id);
  if (!p) return res.status(400).json({ error: 'Set up your pregnancy first' });
  const [existing] = await db.query('SELECT title, checkup_date FROM checkups WHERE user_id = ?', [req.user.id]);
  const have = new Set(existing.map((c) => c.title + c.checkup_date));
  let added = 0;
  for (const [week, title] of TYPICAL_CHECKUPS) {
    const date = addDays(p.lmp_date, week * 7);
    if (date < todayText() || have.has(title + date)) continue;
    await db.query('INSERT INTO checkups (user_id, title, checkup_date) VALUES (?, ?, ?)', [req.user.id, title, date]);
    added++;
  }
  res.json({ added });
});

// ---------- Kick counter ----------

router.get('/kicks', async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM kick_sessions WHERE user_id = ? ORDER BY started_at DESC LIMIT 30', [req.user.id]);
  res.json(rows);
});

// body: { started_at: ISO time, minutes, kicks }
router.post('/kicks', async (req, res) => {
  const started = new Date(req.body.started_at);
  const minutes = Number(req.body.minutes), kicks = Number(req.body.kicks);
  if (isNaN(started) || !(minutes >= 0) || !(kicks >= 1)) return res.status(400).json({ error: 'Nothing to save yet' });
  await db.query('INSERT INTO kick_sessions (user_id, started_at, minutes, kicks) VALUES (?, ?, ?, ?)',
    [req.user.id, started, Math.round(minutes), Math.round(kicks)]);
  res.json({ ok: true });
});

router.delete('/kicks/:id', async (req, res) => {
  await db.query('DELETE FROM kick_sessions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

// ---------- Contraction timer ----------

// GET: contractions from the last 12 hours (times are stored in UTC)
router.get('/contractions', async (req, res) => {
  const [rows] = await db.query(
    `SELECT * FROM contractions WHERE user_id = ? AND started_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 12 HOUR)
     ORDER BY started_at DESC`, [req.user.id]);
  res.json(rows);
});

// body: { started_at: ISO time, seconds }
router.post('/contractions', async (req, res) => {
  const started = new Date(req.body.started_at);
  const seconds = Number(req.body.seconds);
  if (isNaN(started) || !(seconds >= 1)) return res.status(400).json({ error: 'Nothing to save yet' });
  await db.query('INSERT INTO contractions (user_id, started_at, seconds) VALUES (?, ?, ?)',
    [req.user.id, started, Math.round(seconds)]);
  res.json({ ok: true });
});

router.delete('/contractions', async (req, res) => {
  await db.query('DELETE FROM contractions WHERE user_id = ?', [req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
