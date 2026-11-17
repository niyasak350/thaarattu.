// A parent's own health record, health readings (vitals) and sharing with doctors
const express = require('express');
const db = require('../db');
const { buildRecord, readRange, isDate } = require('../records');

const router = express.Router();

// GET /api/records?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/', async (req, res) => {
  const range = readRange(req.query);
  if (!range) return res.status(400).json({ error: 'Please choose a valid period' });
  res.json(await buildRecord(req.user.id, range.from, range.to, false));
});

// ---------- Vitals: weight, blood pressure, sugar ----------

router.get('/vitals', async (req, res) => {
  const [rows] = await db.query(
    'SELECT * FROM vitals WHERE user_id = ? ORDER BY record_date DESC, id DESC LIMIT 60', [req.user.id]);
  res.json(rows);
});

router.post('/vitals', async (req, res) => {
  const b = req.body;
  const number = (v) => (v === '' || v === undefined || v === null ? null : Number(v));
  const values = [number(b.weight_kg), number(b.bp_high), number(b.bp_low), number(b.sugar)];
  if (!isDate(b.record_date)) return res.status(400).json({ error: 'Date is required' });
  if (values.every((v) => v === null) && !b.note) return res.status(400).json({ error: 'Enter at least one reading' });
  if (values.some((v) => v !== null && !(v > 0 && v < 1000))) return res.status(400).json({ error: 'One of the readings does not look right' });
  await db.query(
    'INSERT INTO vitals (user_id, record_date, weight_kg, bp_high, bp_low, sugar, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, b.record_date, ...values, (b.note || '').slice(0, 300) || null]);
  res.json({ ok: true });
});

router.delete('/vitals/:id', async (req, res) => {
  await db.query('DELETE FROM vitals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

// ---------- Sharing with doctors ----------

// GET /api/records/doctors  - doctors this parent has booked, and whether records are shared with each
router.get('/doctors', async (req, res) => {
  const [rows] = await db.query(
    `SELECT d.id, d.name, d.speciality, h.name AS hospital,
            EXISTS (SELECT 1 FROM record_shares s WHERE s.user_id = ? AND s.doctor_id = d.id) AS shared
     FROM doctors d JOIN hospitals h ON h.id = d.hospital_id
     WHERE d.id IN (SELECT doctor_id FROM appointments WHERE user_id = ? AND status <> 'cancelled')
        OR d.id IN (SELECT doctor_id FROM record_shares WHERE user_id = ?)
     ORDER BY d.name`, [req.user.id, req.user.id, req.user.id]);
  res.json(rows);
});

// PUT /api/records/doctors/:doctorId  - body: { shared: true/false }
router.put('/doctors/:doctorId', async (req, res) => {
  if (req.body.shared) {
    const [booked] = await db.query(
      `SELECT id FROM appointments WHERE user_id = ? AND doctor_id = ? AND status <> 'cancelled' LIMIT 1`,
      [req.user.id, req.params.doctorId]);
    if (!booked.length) return res.status(400).json({ error: 'You can share with a doctor after booking an appointment with them' });
    await db.query('INSERT IGNORE INTO record_shares (user_id, doctor_id) VALUES (?, ?)', [req.user.id, req.params.doctorId]);
  } else {
    await db.query('DELETE FROM record_shares WHERE user_id = ? AND doctor_id = ?', [req.user.id, req.params.doctorId]);
  }
  res.json({ ok: true });
});

module.exports = router;
