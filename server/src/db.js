// One shared MySQL connection pool for the whole server
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'thaaraattu',
  socketPath: process.env.DB_SOCKET || undefined,
  // online databases usually need an encrypted connection: set DB_SSL=true
  ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
  timezone: 'Z',    // date-times are stored in UTC so they are right on any server
  dateStrings: true, // return DATE columns as 'YYYY-MM-DD' text
});

module.exports = pool;
