const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { TYPES, list, readBody } = require('../content');
const { createLogin, setPassword } = require('../accounts');
const { checkHospital, addDoctor, updateDoctor, deleteDoctor, listDoctors, listAppointments } = require('../doctors');

const router = express.Router();

// GET /api/admin/stats  - numbers for the dashboard
// Note: mood and screening data are shown only as totals. Admin never sees one mother's entries.
router.get('/stats', async (req, res) => {
  const [[row]] = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'parent') AS parents,
      (SELECT COUNT(*) FROM users WHERE role = 'doctor') AS doctor_logins,
      (SELECT COUNT(*) FROM record_shares) AS shares,
      (SELECT COUNT(*) FROM children) AS children,
      (SELECT COUNT(*) FROM pregnancies WHERE status = 'active') AS pregnancies,
      (SELECT COUNT(*) FROM child_vaccinations WHERE given_date IS NOT NULL) AS vaccines_given,
      (SELECT COUNT(*) FROM child_vaccinations WHERE given_date IS NULL AND due_date < CURDATE()) AS vaccines_overdue,
      (SELECT COUNT(*) FROM hospitals) AS hospitals,
      (SELECT COUNT(*) FROM doctors) AS doctors,
      (SELECT COUNT(*) FROM appointments WHERE status = 'booked' AND appt_date >= CURDATE()) AS upcoming_appointments,
      (SELECT COUNT(*) FROM screenings WHERE taken_on >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) AS screenings_month,
      (SELECT COUNT(*) FROM screenings WHERE taken_on >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND score >= 15) AS screenings_high_month,
      (SELECT COUNT(*) FROM mood_logs WHERE log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) AS mood_logs_week,
      (SELECT ROUND(AVG(mood), 1) FROM mood_logs WHERE log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)) AS avg_mood_week`);
  const [signups] = await db.query(`
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
    FROM users WHERE role = 'parent' GROUP BY month ORDER BY month DESC LIMIT 6`);
  res.json({ ...row, signups: signups.reverse() });
});

// ---------- Users ----------

router.get('/users', async (req, res) => {
  const [rows] = await db.query(`
    SELECT u.id, u.name, u.email, u.role, u.is_blocked, u.created_at,
           (SELECT COUNT(*) FROM children c WHERE c.user_id = u.id) AS children
    FROM users u ORDER BY u.created_at DESC`);
  res.json(rows);
});

// PUT /api/admin/users/:id/block  - body: { blocked: true/false }
router.put('/users/:id/block', async (req, res) => {
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'You cannot block yourself' });
  await db.query('UPDATE users SET is_blocked = ? WHERE id = ?',
    [req.body.blocked ? 1 : 0, req.params.id]);
  res.json({ ok: true });
});

// PUT /api/admin/users/:id  - body: { name, email, role } and optionally { password } to reset it
router.put('/users/:id', async (req, res) => {
  const { name, email, role, password } = req.body;
  if (!name || !email || !['parent', 'admin', 'doctor', 'hospital_admin'].includes(role)) return res.status(400).json({ error: 'Name, email and role are required' });
  if (Number(req.params.id) === req.user.id && role !== 'admin') return res.status(400).json({ error: 'You cannot remove your own admin role' });
  const [taken] = await db.query('SELECT id FROM users WHERE email = ? AND id <> ?', [email, req.params.id]);
  if (taken.length) return res.status(400).json({ error: 'Another account already uses that email' });
  await db.query('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [name, email, role, req.params.id]);
  if (password) {
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [await bcrypt.hash(password, 10), req.params.id]);
  }
  res.json({ ok: true });
});

router.delete('/users/:id', async (req, res) => {
  if (Number(req.params.id) === req.user.id) return res.status(400).json({ error: 'You cannot delete yourself' });
  await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ---------- Vaccine master list ----------

// Each "check" function returns { error } or { values } for the INSERT / UPDATE
function checkVaccine(b) {
  if (!b.name || b.due_age_weeks === '' || !(Number(b.due_age_weeks) >= 0)) {
    return { error: 'Name and due age (weeks) are required' };
  }
  return { values: [b.name, b.due_age_weeks, b.description || null] };
}

router.get('/vaccines', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM vaccines ORDER BY due_age_weeks, id');
  res.json(rows);
});

// New vaccines apply to children added afterwards
router.post('/vaccines', async (req, res) => {
  const { error, values } = checkVaccine(req.body);
  if (error) return res.status(400).json({ error });
  await db.query('INSERT INTO vaccines (name, due_age_weeks, description) VALUES (?, ?, ?)', values);
  res.json({ ok: true });
});

// Editing the due age also moves the due date of doses that are not given yet
router.put('/vaccines/:id', async (req, res) => {
  const { error, values } = checkVaccine(req.body);
  if (error) return res.status(400).json({ error });
  await db.query('UPDATE vaccines SET name = ?, due_age_weeks = ?, description = ? WHERE id = ?',
    [...values, req.params.id]);
  await db.query(
    `UPDATE child_vaccinations cv JOIN children c ON c.id = cv.child_id
     SET cv.due_date = DATE_ADD(c.dob, INTERVAL ? WEEK)
     WHERE cv.vaccine_id = ? AND cv.given_date IS NULL`, [req.body.due_age_weeks, req.params.id]);
  res.json({ ok: true });
});

router.delete('/vaccines/:id', async (req, res) => {
  await db.query('DELETE FROM vaccines WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ---------- Meal plans ----------

function checkMeal(b) {
  if (!b.title || b.min_months === '' || b.max_months === '' || Number(b.min_months) > Number(b.max_months)) {
    return { error: 'Title and a valid age range are required' };
  }
  return {
    values: [b.min_months, b.max_months, b.meal_type || 'anytime', b.title, b.recipe || null,
      (b.allergens || '').toLowerCase()],
  };
}

router.get('/meals', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM meal_plans ORDER BY min_months, id');
  res.json(rows);
});

router.post('/meals', async (req, res) => {
  const { error, values } = checkMeal(req.body);
  if (error) return res.status(400).json({ error });
  await db.query(
    'INSERT INTO meal_plans (min_months, max_months, meal_type, title, recipe, allergens) VALUES (?, ?, ?, ?, ?, ?)',
    values);
  res.json({ ok: true });
});

router.put('/meals/:id', async (req, res) => {
  const { error, values } = checkMeal(req.body);
  if (error) return res.status(400).json({ error });
  await db.query(
    `UPDATE meal_plans SET min_months = ?, max_months = ?, meal_type = ?, title = ?, recipe = ?, allergens = ?
     WHERE id = ?`, [...values, req.params.id]);
  res.json({ ok: true });
});

router.delete('/meals/:id', async (req, res) => {
  await db.query('DELETE FROM meal_plans WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ---------- Hospitals and doctors ----------
// The main admin makes each hospital and (optionally) a login for its administrator,
// who then looks after that hospital's doctors. The main admin can still change everything.

router.get('/hospitals', async (req, res) => {
  const [hospitals] = await db.query(
    `SELECT h.*, u.email AS admin_email FROM hospitals h LEFT JOIN users u ON u.id = h.admin_user_id
     ORDER BY h.city, h.name`);
  const doctors = await listDoctors();
  res.json(hospitals.map((h) => ({ ...h, doctors: doctors.filter((d) => d.hospital_id === h.id) })));
});

// body may include admin_email + admin_password to make the hospital administrator's login
router.post('/hospitals', async (req, res) => {
  const { error, values } = checkHospital(req.body);
  if (error) return res.status(400).json({ error });
  let adminId = null;
  if (req.body.admin_email) {
    const login = await createLogin({
      name: req.body.name + ' admin', email: req.body.admin_email, password: req.body.admin_password, role: 'hospital_admin',
    });
    if (login.error) return res.status(400).json({ error: login.error });
    adminId = login.id;
  }
  await db.query(
    `INSERT INTO hospitals (name, address, city, phone, latitude, longitude, has_emergency, admin_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [...values, adminId]);
  res.json({ ok: true });
});

router.put('/hospitals/:id', async (req, res) => {
  const { error, values } = checkHospital(req.body);
  if (error) return res.status(400).json({ error });
  const [rows] = await db.query('SELECT admin_user_id FROM hospitals WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Hospital not found' });
  if (!rows[0].admin_user_id && req.body.admin_email) {
    const login = await createLogin({
      name: req.body.name + ' admin', email: req.body.admin_email, password: req.body.admin_password, role: 'hospital_admin',
    });
    if (login.error) return res.status(400).json({ error: login.error });
    await db.query('UPDATE hospitals SET admin_user_id = ? WHERE id = ?', [login.id, req.params.id]);
  } else if (rows[0].admin_user_id && req.body.admin_password) {
    const changed = await setPassword(rows[0].admin_user_id, req.body.admin_password);
    if (changed.error) return res.status(400).json({ error: changed.error });
  }
  await db.query(
    `UPDATE hospitals SET name = ?, address = ?, city = ?, phone = ?, latitude = ?, longitude = ?, has_emergency = ?
     WHERE id = ?`, [...values, req.params.id]);
  res.json({ ok: true });
});

// Deleting a hospital also removes its doctors' logins and its administrator's login
router.delete('/hospitals/:id', async (req, res) => {
  const [rows] = await db.query('SELECT admin_user_id FROM hospitals WHERE id = ?', [req.params.id]);
  const doctors = await listDoctors(req.params.id);
  await db.query('DELETE FROM hospitals WHERE id = ?', [req.params.id]);
  const logins = [...doctors.map((d) => d.user_id), rows[0] && rows[0].admin_user_id].filter(Boolean);
  if (logins.length) await db.query('DELETE FROM users WHERE id IN (?)', [logins]);
  res.json({ ok: true });
});

async function findDoctor(req, res) {
  const [rows] = await db.query('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
  if (!rows.length) { res.status(404).json({ error: 'Doctor not found' }); return null; }
  return rows[0];
}

router.post('/doctors', async (req, res) => {
  if (!req.body.hospital_id) return res.status(400).json({ error: 'Choose a hospital' });
  const { error } = await addDoctor(req.body, req.body.hospital_id);
  if (error) return res.status(400).json({ error });
  res.json({ ok: true });
});

router.put('/doctors/:id', async (req, res) => {
  const doctor = await findDoctor(req, res);
  if (!doctor) return;
  const { error } = await updateDoctor(doctor, req.body);
  if (error) return res.status(400).json({ error });
  if (req.body.hospital_id) await db.query('UPDATE doctors SET hospital_id = ? WHERE id = ?', [req.body.hospital_id, doctor.id]);
  res.json({ ok: true });
});

router.delete('/doctors/:id', async (req, res) => {
  const doctor = await findDoctor(req, res);
  if (!doctor) return;
  await deleteDoctor(doctor);
  res.json({ ok: true });
});

// ---------- Appointments ----------

router.get('/appointments', async (req, res) => res.json(await listAppointments('', [])));

// PUT /api/admin/appointments/:id  - body: { status }
router.put('/appointments/:id', async (req, res) => {
  if (!['booked', 'completed', 'cancelled'].includes(req.body.status)) {
    return res.status(400).json({ error: 'Unknown status' });
  }
  await db.query('UPDATE appointments SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
  res.json({ ok: true });
});

// ---------- Reviews (moderation) ----------

router.get('/reviews', async (req, res) => {
  const [rows] = await db.query(`
    SELECT r.id, r.rating, r.comment, r.created_at, u.name AS parent, d.name AS doctor
    FROM reviews r JOIN users u ON u.id = r.user_id JOIN doctors d ON d.id = r.doctor_id
    ORDER BY r.created_at DESC`);
  res.json(rows);
});

router.delete('/reviews/:id', async (req, res) => {
  await db.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ---------- Site settings (app name, tagline, intro video) ----------

// PUT /api/admin/settings  - body: { app_name, tagline, intro_video, intro_seconds, creators_note }
router.put('/settings', async (req, res) => {
  const appName = (req.body.app_name || '').trim();
  if (!appName) return res.status(400).json({ error: 'App name is required' });
  const video = (req.body.intro_video || '').trim();
  // only web links or files in the site's own folder are allowed as the intro video
  if (video && !/^(https?:\/\/|\/)/.test(video)) {
    return res.status(400).json({ error: 'The intro video must be a link starting with http:// or https:// (or a file path starting with /)' });
  }
  const seconds = Math.min(60, Math.max(2, Number(req.body.intro_seconds) || 6));
  const save = (name, value) => db.query(
    'INSERT INTO settings (name, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)', [name, value]);
  await save('app_name', appName.slice(0, 60));
  await save('tagline', (req.body.tagline || '').trim().slice(0, 200));
  await save('intro_video', video.slice(0, 250));
  await save('intro_seconds', String(seconds));
  if (req.body.creators_note !== undefined) await save('creators_note', String(req.body.creators_note).trim().slice(0, 250));
  // the first page photo: a picture saved as text, or '' to go back to the drawing
  if (req.body.hero_image !== undefined) {
    const image = String(req.body.hero_image);
    if (image && (!image.startsWith('data:image/') || image.length > 1500000)) {
      return res.status(400).json({ error: 'The first page photo is not a valid picture, or it is too large' });
    }
    await save('hero_image', image);
  }
  res.json({ ok: true });
});

// ---------- Guides, foods, quiz, affirmations (see ../content.js) ----------

// Makes sure :type is one we know, and puts its description on req.type
router.param('type', (req, res, next, name) => {
  if (!TYPES[name]) return res.status(404).json({ error: 'Unknown content type' });
  req.type = TYPES[name];
  next();
});

router.get('/content/:type', async (req, res) => res.json(await list(req.type)));

router.post('/content/:type', async (req, res) => {
  const { error, values } = readBody(req.type, req.body);
  if (error) return res.status(400).json({ error });
  const t = req.type;
  await db.query(
    `INSERT INTO ${t.table} (${t.fields.join(', ')}) VALUES (${t.fields.map(() => '?').join(', ')})`, values);
  res.json({ ok: true });
});

router.put('/content/:type/:id', async (req, res) => {
  const { error, values } = readBody(req.type, req.body);
  if (error) return res.status(400).json({ error });
  const t = req.type;
  await db.query(
    `UPDATE ${t.table} SET ${t.fields.map((f) => f + ' = ?').join(', ')} WHERE id = ?`, [...values, req.params.id]);
  res.json({ ok: true });
});

router.delete('/content/:type/:id', async (req, res) => {
  await db.query(`DELETE FROM ${req.type.table} WHERE id = ?`, [req.params.id]);
  res.json({ ok: true });
});

router.delete('/feedback/:id', async (req, res) => {
  await db.query('DELETE FROM feedback WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ---------- Feedback ----------

router.get('/feedback', async (req, res) => {
  const [rows] = await db.query(`
    SELECT f.id, f.message, f.created_at, u.name, u.email
    FROM feedback f JOIN users u ON u.id = f.user_id ORDER BY f.created_at DESC`);
  res.json(rows);
});

module.exports = router;
