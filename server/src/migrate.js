// Brings an existing database up to date when the server starts.
// Every step checks first, so running it again changes nothing.
const db = require('./db');

async function hasTable(table) {
  const [rows] = await db.query(
    'SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?', [table]);
  return rows.length > 0;
}

async function column(table, name) {
  const [rows] = await db.query(
    `SELECT COLUMN_TYPE AS type FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`, [table, name]);
  return rows[0] || null;
}

async function prepareDatabase() {
  // --- Creators page ---
  if (!(await hasTable('creators'))) {
    await db.query(`CREATE TABLE creators (
      id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, role VARCHAR(100), photo MEDIUMTEXT,
      about VARCHAR(600), details VARCHAR(300), email VARCHAR(150), phone VARCHAR(30), link VARCHAR(250),
      sort_order INT NOT NULL DEFAULT 0)`);
    for (let n = 1; n <= 4; n++) {
      await db.query('INSERT INTO creators (name, role, about, sort_order) VALUES (?, ?, ?, ?)',
        ['Team member ' + n, 'Role', 'Edit this from the admin panel: add a photo, role and details.', n]);
    }
  }

  // --- Doctor and hospital administrator logins ---
  const role = await column('users', 'role');
  if (role && !role.type.includes('doctor')) {
    await db.query(`ALTER TABLE users MODIFY role ENUM('parent','admin','doctor','hospital_admin') NOT NULL DEFAULT 'parent'`);
  }
  if (!(await column('hospitals', 'admin_user_id'))) {
    await db.query('ALTER TABLE hospitals ADD admin_user_id INT NULL'); // the hospital administrator's login
  }
  if (!(await column('doctors', 'user_id'))) {
    await db.query('ALTER TABLE doctors ADD user_id INT NULL');         // the doctor's login
  }

  // --- Settings can now hold a picture (the first page photo) ---
  const value = await column('settings', 'value');
  if (value && !value.type.includes('mediumtext')) {
    await db.query('ALTER TABLE settings MODIFY value MEDIUMTEXT NOT NULL');
  }

  // --- Which doctors a parent has shared their records with ---
  await db.query(`CREATE TABLE IF NOT EXISTS record_shares (
    user_id INT NOT NULL, doctor_id INT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, doctor_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE)`);

  // --- Mother's health readings: weight, blood pressure, sugar ---
  await db.query(`CREATE TABLE IF NOT EXISTS vitals (
    id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, record_date DATE NOT NULL,
    weight_kg DECIMAL(5,2) NULL, bp_high SMALLINT NULL, bp_low SMALLINT NULL, sugar SMALLINT NULL,
    note VARCHAR(300),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE)`);

  // --- Photo album for each child ---
  await db.query(`CREATE TABLE IF NOT EXISTS child_photos (
    id INT AUTO_INCREMENT PRIMARY KEY, child_id INT NOT NULL, photo MEDIUMTEXT NOT NULL,
    caption VARCHAR(150), taken_on DATE NOT NULL,
    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE)`);

  // --- Videos and first-page pictures (managed by admin) ---
  await db.query(`CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(150) NOT NULL, url VARCHAR(250) NOT NULL,
    category ENUM('pregnancy','baby','wellbeing') NOT NULL DEFAULT 'baby')`);
  await db.query(`CREATE TABLE IF NOT EXISTS site_photos (
    id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(100) NOT NULL, photo MEDIUMTEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0)`);
}

module.exports = prepareDatabase;
