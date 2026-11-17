// What a doctor can do after logging in: appointments, timing, and shared patient records
const express = require('express');
const db = require('../db');
const { listAppointments } = require('../doctors');
const { buildRecord, readRange } = require('../records');

const router = express.Router();

// Every route needs the doctor profile linked to this login
router.use(async (req, res, next) => {
  const [rows] = await db.query(
    `SELECT d.*, h.name AS hospital_name, h.city FROM doctors d JOIN hospitals h ON h.id = d.hospital_id
     WHERE d.user_id = ?`, [req.user.id]);
  if (!rows.length) return res.status(403).json({ error: 'This login is not linked to a doctor profile. Ask your hospital administrator.' });
  req.doctor = rows[0];
  next();
});

router.get('/me', (req, res) => res.json(req.doctor));

// PUT /api/doctor/me  - the doctor changes their own timing and fee
router.put('/me', async (req, res) => {
  const { fee, available_days, start_time, end_time } = req.body;
  const time = /^\d{2}:\d{2}$/;
  if (!available_days) return res.status(400).json({ error: 'Pick at least one day' });
  if (!time.test(start_time) || !time.test(end_time) || start_time >= end_time) {
    return res.status(400).json({ error: 'Start time must be before end time' });
  }
  await db.query('UPDATE doctors SET fee = ?, available_days = ?, start_time = ?, end_time = ? WHERE id = ?',
    [fee || 0, available_days, start_time, end_time, req.doctor.id]);
  res.json({ ok: true });
});

router.get('/appointments', async (req, res) => {
  res.json(await listAppointments('WHERE a.doctor_id = ?', [req.doctor.id]));
});

// PUT /api/doctor/appointments/:id  - body: { status: 'completed' | 'cancelled' | 'booked' }
router.put('/appointments/:id', async (req, res) => {
  if (!['booked', 'completed', 'cancelled'].includes(req.body.status)) return res.status(400).json({ error: 'Unknown status' });
  await db.query('UPDATE appointments SET status = ? WHERE id = ? AND doctor_id = ?',
    [req.body.status, req.params.id, req.doctor.id]);
  res.json({ ok: true });
});

// GET /api/doctor/patients  - parents who have shared their records with this doctor
router.get('/patients', async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.id, u.name, s.created_at AS shared_on,
            (SELECT COUNT(*) FROM children c WHERE c.user_id = u.id) AS children,
            (SELECT MAX(appt_date) FROM appointments a WHERE a.user_id = u.id AND a.doctor_id = s.doctor_id) AS last_visit
     FROM record_shares s JOIN users u ON u.id = s.user_id
     WHERE s.doctor_id = ? ORDER BY u.name`, [req.doctor.id]);
  res.json(rows);
});

// GET /api/doctor/patients/:userId/records?from=&to=  - only if that parent shared with this doctor
router.get('/patients/:userId/records', async (req, res) => {
  const [shared] = await db.query('SELECT 1 FROM record_shares WHERE user_id = ? AND doctor_id = ?',
    [req.params.userId, req.doctor.id]);
  if (!shared.length) return res.status(403).json({ error: 'This patient has not shared their records with you' });
  const range = readRange(req.query);
  if (!range) return res.status(400).json({ error: 'Please choose a valid period' });
  res.json(await buildRecord(req.params.userId, range.from, range.to, true));
});

module.exports = router;
