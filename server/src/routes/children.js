const express = require('express');
const db = require('../db');

const router = express.Router();

// Makes sure the child belongs to the logged-in parent
async function findOwnChild(req, res) {
  const [rows] = await db.query(
    'SELECT * FROM children WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!rows.length) { res.status(404).json({ error: 'Child not found' }); return null; }
  return rows[0];
}

// GET /api/children
router.get('/', async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM children WHERE user_id = ? ORDER BY dob DESC', [req.user.id]);
  res.json(rows);
});

// POST /api/children  - add a child and auto-create the vaccine schedule
router.post('/', async (req, res) => {
  const { name, dob, gender, blood_group, allergies } = req.body;
  if (!name || !dob || !gender) return res.status(400).json({ error: 'Name, date of birth and gender are required' });
  if (new Date(dob) > new Date()) return res.status(400).json({ error: 'Date of birth cannot be in the future' });

  const [result] = await db.query(
    'INSERT INTO children (user_id, name, dob, gender, blood_group, allergies) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, name, dob, gender, blood_group || null, allergies || null]);

  // due date = date of birth + vaccine's due age in weeks
  await db.query(
    `INSERT INTO child_vaccinations (child_id, vaccine_id, due_date)
     SELECT ?, id, DATE_ADD(?, INTERVAL due_age_weeks WEEK) FROM vaccines`,
    [result.insertId, dob]);

  res.json({ id: result.insertId });
});

// GET /api/children/:id
router.get('/:id', async (req, res) => {
  const child = await findOwnChild(req, res);
  if (child) res.json(child);
});

// DELETE /api/children/:id
router.delete('/:id', async (req, res) => {
  const child = await findOwnChild(req, res);
  if (!child) return;
  await db.query('DELETE FROM children WHERE id = ?', [child.id]);
  res.json({ ok: true });
});

// ---------- Growth tracker ----------

// GET /api/children/:id/growth
router.get('/:id/growth', async (req, res) => {
  const child = await findOwnChild(req, res);
  if (!child) return;
  const [rows] = await db.query(
    'SELECT * FROM growth_records WHERE child_id = ? ORDER BY record_date', [child.id]);
  res.json(rows);
});

// POST /api/children/:id/growth
router.post('/:id/growth', async (req, res) => {
  const child = await findOwnChild(req, res);
  if (!child) return;
  const { record_date, height_cm, weight_kg } = req.body;
  if (!record_date || !(height_cm > 0) || !(weight_kg > 0)) {
    return res.status(400).json({ error: 'Date, height and weight are required' });
  }
  await db.query(
    'INSERT INTO growth_records (child_id, record_date, height_cm, weight_kg) VALUES (?, ?, ?, ?)',
    [child.id, record_date, height_cm, weight_kg]);
  res.json({ ok: true });
});

// DELETE /api/children/:id/growth/:recordId
router.delete('/:id/growth/:recordId', async (req, res) => {
  const child = await findOwnChild(req, res);
  if (!child) return;
  await db.query('DELETE FROM growth_records WHERE id = ? AND child_id = ?',
    [req.params.recordId, child.id]);
  res.json({ ok: true });
});

// ---------- Vaccinations ----------

// GET /api/children/:id/vaccinations
router.get('/:id/vaccinations', async (req, res) => {
  const child = await findOwnChild(req, res);
  if (!child) return;
  const [rows] = await db.query(
    `SELECT cv.id, v.name, v.description, cv.due_date, cv.given_date
     FROM child_vaccinations cv JOIN vaccines v ON v.id = cv.vaccine_id
     WHERE cv.child_id = ? ORDER BY cv.due_date, v.id`, [child.id]);
  res.json(rows);
});

// PUT /api/children/:id/vaccinations/:vacId  - mark given (send given_date) or undo (send null)
router.put('/:id/vaccinations/:vacId', async (req, res) => {
  const child = await findOwnChild(req, res);
  if (!child) return;
  await db.query('UPDATE child_vaccinations SET given_date = ? WHERE id = ? AND child_id = ?',
    [req.body.given_date || null, req.params.vacId, child.id]);
  res.json({ ok: true });
});

// PUT /api/children/:id  - update allergies
router.put('/:id', async (req, res) => {
  const child = await findOwnChild(req, res);
  if (!child) return;
  await db.query('UPDATE children SET allergies = ? WHERE id = ?', [req.body.allergies || null, child.id]);
  res.json({ ok: true });
});

// ---------- Nutrition planner ----------

// GET /api/children/:id/meals  - meal ideas that fit the child's age today
router.get('/:id/meals', async (req, res) => {
  const child = await findOwnChild(req, res);
  if (!child) return;
  const [rows] = await db.query(
    `SELECT * FROM meal_plans
     WHERE TIMESTAMPDIFF(MONTH, ?, CURDATE()) BETWEEN min_months AND max_months
     ORDER BY FIELD(meal_type, 'anytime', 'breakfast', 'lunch', 'snack', 'dinner'), id`, [child.dob]);
  res.json(rows);
});

// ---------- Health monitoring ----------

const HEALTH_TYPES = ['fever', 'medicine', 'doctor_visit', 'symptom', 'other'];

// GET /api/children/:id/health
router.get('/:id/health', async (req, res) => {
  const child = await findOwnChild(req, res);
  if (!child) return;
  const [rows] = await db.query(
    'SELECT * FROM health_records WHERE child_id = ? ORDER BY record_date DESC, id DESC', [child.id]);
  res.json(rows);
});

// POST /api/children/:id/health
router.post('/:id/health', async (req, res) => {
  const child = await findOwnChild(req, res);
  if (!child) return;
  const { record_date, type, title, details, temperature_c } = req.body;
  if (!record_date || !title || !HEALTH_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Date, type and title are required' });
  }
  await db.query(
    `INSERT INTO health_records (child_id, record_date, type, title, details, temperature_c)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [child.id, record_date, type, title, details || null, temperature_c || null]);
  res.json({ ok: true });
});

// DELETE /api/children/:id/health/:recordId
router.delete('/:id/health/:recordId', async (req, res) => {
  const child = await findOwnChild(req, res);
  if (!child) return;
  await db.query('DELETE FROM health_records WHERE id = ? AND child_id = ?',
    [req.params.recordId, child.id]);
  res.json({ ok: true });
});

// ---------- Photo album ----------

// GET /api/children/:id/photos
router.get('/:id/photos', async (req, res) => {
  const child = await findOwnChild(req, res);
  if (!child) return;
  const [rows] = await db.query(
    'SELECT * FROM child_photos WHERE child_id = ? ORDER BY taken_on DESC, id DESC LIMIT 80', [child.id]);
  res.json(rows);
});

// POST /api/children/:id/photos  - body: { photo (picture saved as text), caption, taken_on }
router.post('/:id/photos', async (req, res) => {
  const child = await findOwnChild(req, res);
  if (!child) return;
  const { photo, caption, taken_on } = req.body;
  if (!String(photo || '').startsWith('data:image/') || photo.length > 1200000) {
    return res.status(400).json({ error: 'Please choose a picture' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(taken_on || '')) return res.status(400).json({ error: 'Date is required' });
  await db.query('INSERT INTO child_photos (child_id, photo, caption, taken_on) VALUES (?, ?, ?, ?)',
    [child.id, photo, (caption || '').slice(0, 150) || null, taken_on]);
  res.json({ ok: true });
});

// DELETE /api/children/:id/photos/:photoId
router.delete('/:id/photos/:photoId', async (req, res) => {
  const child = await findOwnChild(req, res);
  if (!child) return;
  await db.query('DELETE FROM child_photos WHERE id = ? AND child_id = ?', [req.params.photoId, child.id]);
  res.json({ ok: true });
});

module.exports = router;
