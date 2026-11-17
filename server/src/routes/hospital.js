// What a hospital administrator can do: manage their own hospital, its doctors and appointments
const express = require('express');
const db = require('../db');
const { checkHospital, addDoctor, updateDoctor, deleteDoctor, listDoctors, listAppointments } = require('../doctors');

const router = express.Router();

// Every route needs the hospital linked to this login
router.use(async (req, res, next) => {
  const [rows] = await db.query('SELECT * FROM hospitals WHERE admin_user_id = ?', [req.user.id]);
  if (!rows.length) return res.status(403).json({ error: 'This login is not linked to a hospital. Ask the site admin.' });
  req.hospital = rows[0];
  next();
});

router.get('/me', async (req, res) => {
  res.json({ ...req.hospital, doctors: await listDoctors(req.hospital.id) });
});

router.put('/me', async (req, res) => {
  const { error, values } = checkHospital(req.body);
  if (error) return res.status(400).json({ error });
  await db.query(
    `UPDATE hospitals SET name = ?, address = ?, city = ?, phone = ?, latitude = ?, longitude = ?, has_emergency = ?
     WHERE id = ?`, [...values, req.hospital.id]);
  res.json({ ok: true });
});

// A doctor of this hospital, or null (and a 404 reply)
async function ownDoctor(req, res) {
  const [rows] = await db.query('SELECT * FROM doctors WHERE id = ? AND hospital_id = ?', [req.params.id, req.hospital.id]);
  if (!rows.length) { res.status(404).json({ error: 'Doctor not found' }); return null; }
  return rows[0];
}

router.post('/doctors', async (req, res) => {
  const { error } = await addDoctor(req.body, req.hospital.id);
  if (error) return res.status(400).json({ error });
  res.json({ ok: true });
});

router.put('/doctors/:id', async (req, res) => {
  const doctor = await ownDoctor(req, res);
  if (!doctor) return;
  const { error } = await updateDoctor(doctor, req.body);
  if (error) return res.status(400).json({ error });
  res.json({ ok: true });
});

router.delete('/doctors/:id', async (req, res) => {
  const doctor = await ownDoctor(req, res);
  if (!doctor) return;
  await deleteDoctor(doctor);
  res.json({ ok: true });
});

router.get('/appointments', async (req, res) => {
  res.json(await listAppointments('WHERE d.hospital_id = ?', [req.hospital.id]));
});

router.put('/appointments/:id', async (req, res) => {
  if (!['booked', 'completed', 'cancelled'].includes(req.body.status)) return res.status(400).json({ error: 'Unknown status' });
  await db.query(
    `UPDATE appointments a JOIN doctors d ON d.id = a.doctor_id SET a.status = ?
     WHERE a.id = ? AND d.hospital_id = ?`, [req.body.status, req.params.id, req.hospital.id]);
  res.json({ ok: true });
});

router.get('/reviews', async (req, res) => {
  const [rows] = await db.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS parent, d.name AS doctor
     FROM reviews r JOIN users u ON u.id = r.user_id JOIN doctors d ON d.id = r.doctor_id
     WHERE d.hospital_id = ? ORDER BY r.created_at DESC`, [req.hospital.id]);
  res.json(rows);
});

module.exports = router;
