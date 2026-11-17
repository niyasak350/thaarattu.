const path = require('path');
// Always read server/.env, whichever folder the server is started from
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const { requireLogin, requireAdmin, requireRole } = require('./middleware/auth');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env first.');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '3mb' })); // creator photos are sent as text, so allow bigger requests

const db = require('./db');
const { TYPES, list } = require('./content');

// Public: app name and tagline (the login page needs them before anyone is logged in)
app.get('/api/settings', async (req, res) => {
  const [rows] = await db.query('SELECT name, value FROM settings');
  res.json(Object.fromEntries(rows.map((r) => [r.name, r.value])));
});

// Public: the people who made the site, and the pictures on the first page
app.get('/api/creators', async (req, res) => res.json(await list(TYPES.creators)));
app.get('/api/site-photos', async (req, res) => res.json(await list(TYPES['site-photos'])));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/pregnancy', requireLogin, require('./routes/pregnancy'));

// Guides, foods, quiz and affirmations for logged-in users (admin edits them under /api/admin/content)
app.get('/api/content/:type', requireLogin, async (req, res) => {
  const type = TYPES[req.params.type];
  if (!type) return res.status(404).json({ error: 'Unknown content type' });
  res.json(await list(type));
});
app.use('/api/children', requireLogin, require('./routes/children'));
app.use('/api/mood', requireLogin, require('./routes/mood'));
app.use('/api/wellness', requireLogin, require('./routes/wellness'));
app.use('/api/care', requireLogin, require('./routes/care'));
app.use('/api/assistant', requireLogin, require('./routes/assistant'));
app.use('/api/records', requireLogin, require('./routes/records'));
app.use('/api/doctor', requireLogin, requireRole('doctor'), require('./routes/doctor'));
app.use('/api/hospital', requireLogin, requireRole('hospital_admin'), require('./routes/hospital'));
app.use('/api/admin', requireLogin, requireAdmin, require('./routes/admin'));

// When the React app has been built (client/dist), serve it from this server too.
// This is what makes the project run as one website when hosted online.
const fs = require('fs');
const clientBuild = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get(/^(?!\/api\/).*/, (req, res) => res.sendFile(path.join(clientBuild, 'index.html')));
}

// Any error ends up here
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

require('./migrate')().catch((err) => console.error('Could not prepare the database:', err.message));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
