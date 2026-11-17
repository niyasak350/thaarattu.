// Adding and changing hospitals and doctors. Used by the main admin (any hospital)
// and by hospital administrators (their own hospital only).
const db = require('./db');
const { createLogin, setPassword } = require('./accounts');

function checkHospital(b) {
  if (!b.name || !b.address || !b.city) return { error: 'Name, address and city are required' };
  return {
    values: [b.name, b.address, b.city, b.phone || null, b.latitude || null, b.longitude || null,
      b.has_emergency ? 1 : 0],
  };
}

function checkDoctor(b) {
  const time = /^\d{2}:\d{2}$/;
  if (!b.name || !b.speciality) return { error: 'Name and speciality are required' };
  if (!time.test(b.start_time) || !time.test(b.end_time) || b.start_time >= b.end_time) {
    return { error: 'Start time must be before end time' };
  }
  if (!b.available_days) return { error: 'Pick at least one day' };
  return {
    values: [b.name, b.speciality, b.qualification || null, b.experience_years || 0, b.fee || 0,
      b.available_days, b.start_time, b.end_time],
  };
}

// body may include login_email + login_password to give the doctor a login
async function addDoctor(body, hospitalId) {
  const { error, values } = checkDoctor(body);
  if (error) return { error };
  let userId = null;
  if (body.login_email) {
    const login = await createLogin({ name: body.name, email: body.login_email, password: body.login_password, role: 'doctor' });
    if (login.error) return login;
    userId = login.id;
  }
  await db.query(
    `INSERT INTO doctors (name, speciality, qualification, experience_years, fee, available_days, start_time, end_time, hospital_id, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [...values, hospitalId, userId]);
  return {};
}

async function updateDoctor(doctor, body) {
  const { error, values } = checkDoctor(body);
  if (error) return { error };
  if (!doctor.user_id && body.login_email) {
    const login = await createLogin({ name: body.name, email: body.login_email, password: body.login_password, role: 'doctor' });
    if (login.error) return login;
    await db.query('UPDATE doctors SET user_id = ? WHERE id = ?', [login.id, doctor.id]);
  } else if (doctor.user_id && body.login_password) {
    const changed = await setPassword(doctor.user_id, body.login_password);
    if (changed.error) return changed;
  }
  await db.query(
    `UPDATE doctors SET name = ?, speciality = ?, qualification = ?, experience_years = ?, fee = ?,
       available_days = ?, start_time = ?, end_time = ? WHERE id = ?`, [...values, doctor.id]);
  return {};
}

// Deleting a doctor also removes their login
async function deleteDoctor(doctor) {
  await db.query('DELETE FROM doctors WHERE id = ?', [doctor.id]);
  if (doctor.user_id) await db.query('DELETE FROM users WHERE id = ?', [doctor.user_id]);
}

// Doctors of one hospital (or all), with the email they log in with
function listDoctors(hospitalId) {
  return db.query(
    `SELECT d.*, u.email AS login_email FROM doctors d LEFT JOIN users u ON u.id = d.user_id
     ${hospitalId ? 'WHERE d.hospital_id = ?' : ''} ORDER BY d.name`, hospitalId ? [hospitalId] : [])
    .then(([rows]) => rows);
}

// Appointments of one hospital, one doctor, or all
function listAppointments(where, params) {
  return db.query(`
    SELECT a.id, a.user_id, a.appt_date, a.time_slot, a.status, u.name AS parent, c.name AS child,
           d.id AS doctor_id, d.name AS doctor, h.name AS hospital,
           EXISTS (SELECT 1 FROM record_shares s WHERE s.user_id = a.user_id AND s.doctor_id = a.doctor_id) AS shared
    FROM appointments a
    JOIN users u ON u.id = a.user_id
    JOIN doctors d ON d.id = a.doctor_id
    JOIN hospitals h ON h.id = d.hospital_id
    LEFT JOIN children c ON c.id = a.child_id
    ${where} ORDER BY a.appt_date DESC, a.time_slot DESC`, params).then(([rows]) => rows);
}

module.exports = { checkHospital, addDoctor, updateDoctor, deleteDoctor, listDoctors, listAppointments };
