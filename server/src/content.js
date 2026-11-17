// Content the admin manages. One list describes each type, so the same code
// handles reading (for parents) and add / edit / delete (for admin).
const db = require('./db');

const TYPES = {
  'pregnancy-guides': {
    table: 'pregnancy_guides', order: 'week_from, id',
    fields: ['week_from', 'week_to', 'title', 'baby', 'mother', 'tips'],
    required: ['week_from', 'week_to', 'title'],
  },
  'pregnancy-foods': {
    table: 'pregnancy_foods', order: 'kind, trimester, id',
    fields: ['trimester', 'kind', 'title', 'details'],
    required: ['trimester', 'kind', 'title'],
  },
  quiz: {
    table: 'quiz_questions', order: 'id',
    fields: ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct', 'explanation'],
    required: ['question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct'],
  },
  affirmations: {
    table: 'affirmations', order: 'id',
    fields: ['text'],
    required: ['text'],
  },
  'baby-guides': {
    table: 'baby_guides', order: 'month_from, category, id',
    fields: ['month_from', 'month_to', 'category', 'title', 'content'],
    required: ['month_from', 'month_to', 'category', 'title', 'content'],
  },
  videos: {
    table: 'videos', order: 'category, id',
    fields: ['title', 'url', 'category'],
    required: ['title', 'url', 'category'],
    check(body) {
      const ok = /^https:\/\/(www\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]{6,}/.test(body.url || '');
      return ok ? null : 'Please paste a YouTube video link';
    },
  },
  'site-photos': {
    table: 'site_photos', order: 'sort_order, id',
    fields: ['title', 'photo', 'sort_order'],
    required: ['title', 'photo'],
    check(body) {
      if (!String(body.photo).startsWith('data:image/') || body.photo.length > 1200000) return 'The photo is not a valid picture, or it is too large';
      return null;
    },
  },
  creators: {
    table: 'creators', order: 'sort_order, id',
    fields: ['name', 'role', 'photo', 'about', 'details', 'email', 'phone', 'link', 'sort_order'],
    required: ['name'],
    // extra rule: the photo must be a small picture, the link a web address
    check(body) {
      if (body.photo && (!String(body.photo).startsWith('data:image/') || body.photo.length > 600000)) {
        return 'The photo is not a valid picture, or it is too large';
      }
      if (body.link && !/^https?:\/\//.test(body.link)) return 'The link must start with http:// or https://';
      return null;
    },
  },
};

const list = (type) => db.query(`SELECT * FROM ${type.table} ORDER BY ${type.order}`).then(([rows]) => rows);

// Picks the allowed fields from the request body. Returns { error } or { values }.
function readBody(type, body) {
  for (const f of type.required) {
    if (body[f] === undefined || body[f] === null || String(body[f]).trim() === '') {
      return { error: 'Please fill in: ' + f.replace(/_/g, ' ') };
    }
  }
  const problem = type.check ? type.check(body) : null;
  if (problem) return { error: problem };
  return { values: type.fields.map((f) => (body[f] === '' || body[f] === undefined ? null : body[f])) };
}

module.exports = { TYPES, list, readBody };
