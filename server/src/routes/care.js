// Hospitals, doctors, reviews, appointments and reminders
const express = require('express');
const db = require('../db');

const router = express.Router();
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = (n) => String(n).padStart(2, '0');

function todayText() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// All 30-minute slots of a doctor on a date, e.g. ['10:00', '10:30', ...]
function slotsFor(doctor, date) {
  const day = DAYS[new Date(date + 'T00:00:00').getDay()];
  if (!doctor.available_days.split(',').includes(day)) return [];
  const toMinutes = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  const slots = [];
  for (let m = toMinutes(doctor.start_time); m < toMinutes(doctor.end_time); m += 30) {
    slots.push(pad(Math.floor(m / 60)) + ':' + pad(m % 60));
  }
  // for today, hide times that have already passed
  if (date === todayText()) {
    const now = new Date();
    const nowText = pad(now.getHours()) + ':' + pad(now.getMinutes());
    return slots.filter((s) => s > nowText);
  }
  return slots;
}

async function freeSlots(doctor, date) {
  const [taken] = await db.query(
    `SELECT time_slot FROM appointments WHERE doctor_id = ? AND appt_date = ? AND status <> 'cancelled'`,
    [doctor.id, date]);
  const takenSet = new Set(taken.map((t) => t.time_slot));
  return slotsFor(doctor, date).filter((s) => !takenSet.has(s));
}

// Shared SELECT for doctors with their average rating
const DOCTOR_SELECT = `
  SELECT d.id, d.hospital_id, d.name, d.speciality, d.qualification, d.experience_years, d.fee,
         d.available_days, d.start_time, d.end_time, h.name AS hospital_name, h.city,
         (SELECT ROUND(AVG(rating), 1) FROM reviews r WHERE r.doctor_id = d.id) AS rating,
         (SELECT COUNT(*) FROM reviews r WHERE r.doctor_id = d.id) AS review_count
  FROM doctors d JOIN hospitals h ON h.id = d.hospital_id`;

// ---------- Hospitals ----------

// GET /api/care/specialities
router.get('/specialities', async (req, res) => {
  const [rows] = await db.query('SELECT DISTINCT speciality FROM doctors ORDER BY speciality');
  res.json(rows.map((r) => r.speciality));
});

// GET /api/care/hospitals?q=text&speciality=Pediatrics&emergency=1&available=1
// available=1 keeps only hospitals where a doctor consults today
router.get('/hospitals', async (req, res) => {
  const q = '%' + (req.query.q || '') + '%';
  const speciality = req.query.speciality || '';
  const todayName = DAYS[new Date().getDay()];
  const [rows] = await db.query(
    `SELECT h.*,
       (SELECT COUNT(*) FROM doctors d WHERE d.hospital_id = h.id) AS doctor_count,
       (SELECT GROUP_CONCAT(DISTINCT d.speciality ORDER BY d.speciality SEPARATOR ', ')
          FROM doctors d WHERE d.hospital_id = h.id) AS specialities,
       (SELECT ROUND(AVG(r.rating), 1) FROM reviews r JOIN doctors d ON d.id = r.doctor_id
          WHERE d.hospital_id = h.id) AS rating
     FROM hospitals h
     WHERE (h.name LIKE ? OR h.city LIKE ? OR h.address LIKE ?)
       AND (? = '' OR EXISTS (SELECT 1 FROM doctors d WHERE d.hospital_id = h.id AND d.speciality = ?))
       AND (? = 0 OR h.has_emergency = 1)
       AND (? = 0 OR EXISTS (SELECT 1 FROM doctors d WHERE d.hospital_id = h.id AND FIND_IN_SET(?, d.available_days)))
     ORDER BY h.city, h.name`,
    [q, q, q, speciality, speciality, req.query.emergency ? 1 : 0, req.query.available ? 1 : 0, todayName]);
  res.json(rows);
});

// GET /api/care/hospitals/:id  - hospital with its doctors
router.get('/hospitals/:id', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM hospitals WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Hospital not found' });
  const [doctors] = await db.query(DOCTOR_SELECT + ' WHERE d.hospital_id = ? ORDER BY d.name', [req.params.id]);
  res.json({ ...rows[0], doctors });
});

// ---------- Doctors ----------

async function findDoctor(req, res) {
  const [rows] = await db.query(DOCTOR_SELECT + ' WHERE d.id = ?', [req.params.id]);
  if (!rows.length) { res.status(404).json({ error: 'Doctor not found' }); return null; }
  return rows[0];
}

// Only parents who had an appointment with the doctor can review (keeps reviews genuine)
async function hadAppointment(userId, doctorId) {
  const [rows] = await db.query(
    `SELECT id FROM appointments WHERE user_id = ? AND doctor_id = ? AND status <> 'cancelled'
       AND appt_date <= CURDATE() LIMIT 1`, [userId, doctorId]);
  return rows.length > 0;
}

// GET /api/care/doctors/:id  - profile + reviews
router.get('/doctors/:id', async (req, res) => {
  const doctor = await findDoctor(req, res);
  if (!doctor) return;
  const [reviews] = await db.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, r.user_id, u.name
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.doctor_id = ? ORDER BY r.created_at DESC`, [doctor.id]);
  const [shared] = await db.query('SELECT 1 FROM record_shares WHERE user_id = ? AND doctor_id = ?', [req.user.id, doctor.id]);
  res.json({ ...doctor, reviews, can_review: await hadAppointment(req.user.id, doctor.id), shared: shared.length > 0 });
});

// GET /api/care/doctors/:id/slots?date=YYYY-MM-DD  - free time slots
router.get('/doctors/:id/slots', async (req, res) => {
  const doctor = await findDoctor(req, res);
  if (!doctor) return;
  const date = req.query.date || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < todayText()) return res.json([]);
  res.json(await freeSlots(doctor, date));
});

// POST /api/care/doctors/:id/reviews  - body: { rating, comment }. Posting again updates your review.
router.post('/doctors/:id/reviews', async (req, res) => {
  const doctor = await findDoctor(req, res);
  if (!doctor) return;
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1 to 5' });
  if (!(await hadAppointment(req.user.id, doctor.id))) {
    return res.status(403).json({ error: 'You can review a doctor after your appointment' });
  }
  await db.query(
    `INSERT INTO reviews (doctor_id, user_id, rating, comment) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment), created_at = NOW()`,
    [doctor.id, req.user.id, rating, req.body.comment || null]);
  res.json({ ok: true });
});

// ---------- Appointments ----------

// GET /api/care/appointments  - my appointments
router.get('/appointments', async (req, res) => {
  const [rows] = await db.query(
    `SELECT a.id, a.appt_date, a.time_slot, a.status, a.doctor_id, c.name AS child,
            d.name AS doctor, d.speciality, d.fee, h.name AS hospital, h.city, h.phone
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     JOIN hospitals h ON h.id = d.hospital_id
     LEFT JOIN children c ON c.id = a.child_id
     WHERE a.user_id = ? ORDER BY a.appt_date DESC, a.time_slot DESC`, [req.user.id]);
  res.json(rows);
});

// POST /api/care/appointments  - body: { doctor_id, date, time_slot, child_id, share }
// share: true lets this doctor see the parent's health records
router.post('/appointments', async (req, res) => {
  const { doctor_id, date, time_slot, child_id } = req.body;
  const [doctors] = await db.query('SELECT * FROM doctors WHERE id = ?', [doctor_id]);
  if (!doctors.length) return res.status(404).json({ error: 'Doctor not found' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || date < todayText()) {
    return res.status(400).json({ error: 'Please pick today or a future date' });
  }
  if (child_id) {
    const [own] = await db.query('SELECT id FROM children WHERE id = ? AND user_id = ?', [child_id, req.user.id]);
    if (!own.length) return res.status(400).json({ error: 'Child not found' });
  }
  if (!(await freeSlots(doctors[0], date)).includes(time_slot)) {
    return res.status(400).json({ error: 'That time slot is not available. Please pick another.' });
  }
  const [result] = await db.query(
    'INSERT INTO appointments (user_id, doctor_id, child_id, appt_date, time_slot) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, doctor_id, child_id || null, date, time_slot]);
  if (req.body.share) {
    await db.query('INSERT IGNORE INTO record_shares (user_id, doctor_id) VALUES (?, ?)', [req.user.id, doctor_id]);
  }
  res.json({ id: result.insertId });
});

// PUT /api/care/appointments/:id/cancel
router.put('/appointments/:id/cancel', async (req, res) => {
  const [result] = await db.query(
    `UPDATE appointments SET status = 'cancelled' WHERE id = ? AND user_id = ? AND status = 'booked'`,
    [req.params.id, req.user.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Appointment not found' });
  res.json({ ok: true });
});

// ---------- Reminders (shown on the home page) ----------

// GET /api/care/reminders  - check-ups, vaccines (overdue or due in 14 days) and upcoming appointments
router.get('/reminders', async (req, res) => {
  const [vaccines] = await db.query(
    `SELECT cv.id, c.id AS child_id, c.name AS child, v.name AS vaccine, cv.due_date,
            (cv.due_date < CURDATE()) AS overdue
     FROM child_vaccinations cv
     JOIN children c ON c.id = cv.child_id
     JOIN vaccines v ON v.id = cv.vaccine_id
     WHERE c.user_id = ? AND cv.given_date IS NULL AND cv.due_date <= DATE_ADD(CURDATE(), INTERVAL 14 DAY)
     ORDER BY cv.due_date, v.id`, [req.user.id]);
  const [appointments] = await db.query(
    `SELECT a.id, a.appt_date, a.time_slot, d.name AS doctor, h.name AS hospital, c.name AS child
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     JOIN hospitals h ON h.id = d.hospital_id
     LEFT JOIN children c ON c.id = a.child_id
     WHERE a.user_id = ? AND a.status = 'booked' AND a.appt_date >= CURDATE()
     ORDER BY a.appt_date, a.time_slot`, [req.user.id]);
  const [checkups] = await db.query(
    `SELECT id, title, checkup_date, checkup_time, place, (checkup_date < CURDATE()) AS overdue
     FROM checkups
     WHERE user_id = ? AND done = 0 AND checkup_date <= DATE_ADD(CURDATE(), INTERVAL 14 DAY)
     ORDER BY checkup_date, checkup_time`, [req.user.id]);
  res.json({ vaccines, appointments, checkups });
});

module.exports = router;
