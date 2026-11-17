// Builds the combined health record of a mother and her children for a range of dates.
// The parent sees it under "Records"; a doctor sees it only if the parent shared it.
const db = require('./db');

// forDoctor: leave out the private notes the app promised only the mother would see
async function buildRecord(userId, from, to, forDoctor) {
  const range = [userId, from, to];
  const q = (sql, params) => db.query(sql, params).then(([rows]) => rows);

  const [user] = await q('SELECT id, name, email FROM users WHERE id = ?', [userId]);
  const [pregnancy] = await q(
    `SELECT lmp_date, DATE_ADD(lmp_date, INTERVAL 280 DAY) AS due_date,
            FLOOR(DATEDIFF(CURDATE(), lmp_date) / 7) + 1 AS week
     FROM pregnancies WHERE user_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`, [userId]);

  const mother = {
    moods: await q(`SELECT log_date, mood, stress${forDoctor ? '' : ', note'} FROM mood_logs
                    WHERE user_id = ? AND log_date BETWEEN ? AND ? ORDER BY log_date`, range),
    sleep: await q(`SELECT log_date, sleep_hours, energy, pain FROM sleep_logs
                    WHERE user_id = ? AND log_date BETWEEN ? AND ? ORDER BY log_date`, range),
    screenings: await q(`SELECT taken_on, score FROM screenings
                         WHERE user_id = ? AND taken_on BETWEEN ? AND ? ORDER BY taken_on`, range),
    vitals: await q(`SELECT id, record_date, weight_kg, bp_high, bp_low, sugar, note FROM vitals
                     WHERE user_id = ? AND record_date BETWEEN ? AND ? ORDER BY record_date`, range),
    checkups: await q(`SELECT title, checkup_date, checkup_time, place, done FROM checkups
                       WHERE user_id = ? AND checkup_date BETWEEN ? AND ? ORDER BY checkup_date`, range),
    kicks: await q(`SELECT started_at, minutes, kicks FROM kick_sessions
                    WHERE user_id = ? AND started_at >= ? AND started_at < DATE_ADD(?, INTERVAL 1 DAY)
                    ORDER BY started_at`, range),
  };

  const children = await q('SELECT id, name, dob, gender, blood_group, allergies FROM children WHERE user_id = ? ORDER BY dob', [userId]);
  for (const child of children) {
    const r = [child.id, from, to];
    child.growth = await q(`SELECT record_date, height_cm, weight_kg FROM growth_records
                            WHERE child_id = ? AND record_date BETWEEN ? AND ? ORDER BY record_date`, r);
    child.health = await q(`SELECT record_date, type, title, details, temperature_c FROM health_records
                            WHERE child_id = ? AND record_date BETWEEN ? AND ? ORDER BY record_date`, r);
    child.vaccines = await q(`SELECT v.name, cv.given_date FROM child_vaccinations cv
                              JOIN vaccines v ON v.id = cv.vaccine_id
                              WHERE cv.child_id = ? AND cv.given_date BETWEEN ? AND ? ORDER BY cv.given_date`, r);
    const [{ overdue }] = await q(`SELECT COUNT(*) AS overdue FROM child_vaccinations
                                   WHERE child_id = ? AND given_date IS NULL AND due_date < CURDATE()`, [child.id]);
    child.vaccines_overdue = overdue;
  }

  return { user, pregnancy: pregnancy || null, from, to, mother, children };
}

const isDate = (text) => /^\d{4}-\d{2}-\d{2}$/.test(text || '');

// Reads ?from=&to= from a request. Returns null if they are missing or more than 100 days apart.
function readRange(query) {
  const { from, to } = query;
  if (!isDate(from) || !isDate(to) || from > to) return null;
  if ((new Date(to) - new Date(from)) / 86400000 > 100) return null;
  return { from, to };
}

module.exports = { buildRecord, readRange, isDate };
