import CrudPage from './CrudPage';

// Descriptions of each kind of content the admin can manage.
// fields: what the form asks for.  columns: [heading, what to show] for the table.
const detail = (title, text) => <><b>{title}</b><br /><span className="muted">{text}</span></>;

export const CONTENT = {
  'pregnancy-guides': {
    type: 'pregnancy-guides', title: 'Pregnancy Guide',
    help: 'Shown to pregnant users for the week they are in.',
    fields: [
      { name: 'week_from', label: 'From week', type: 'number' },
      { name: 'week_to', label: 'To week', type: 'number' },
      { name: 'title', label: 'Title' },
      { name: 'baby', label: 'How the baby is growing', type: 'textarea', optional: true },
      { name: 'mother', label: 'What the mother may feel', type: 'textarea', optional: true },
      { name: 'tips', label: 'Tips', type: 'textarea', optional: true },
    ],
    columns: [['Weeks', (g) => g.week_from + ' - ' + g.week_to], ['Guide', (g) => detail(g.title, g.tips)]],
  },
  'pregnancy-foods': {
    type: 'pregnancy-foods', title: 'Pregnancy Foods',
    help: 'Food suggestions shown in the pregnancy Food Guide.',
    fields: [
      { name: 'kind', label: 'Type', type: 'select', default: 'eat', options: [['eat', 'Good to eat'], ['avoid', 'Better to avoid']] },
      { name: 'trimester', label: 'When', type: 'select', default: 0, options: [[0, 'Whole pregnancy'], [1, 'Trimester 1'], [2, 'Trimester 2'], [3, 'Trimester 3']] },
      { name: 'title', label: 'Food' },
      { name: 'details', label: 'Details', type: 'textarea', optional: true },
    ],
    columns: [
      ['Type', (f) => <span className={f.kind === 'eat' ? 'badge ok' : 'badge late'}>{f.kind}</span>],
      ['When', (f) => (f.trimester === 0 ? 'Whole pregnancy' : 'Trimester ' + f.trimester)],
      ['Food', (f) => detail(f.title, f.details)],
    ],
  },
  'baby-guides': {
    type: 'baby-guides', title: 'Baby Guide',
    help: 'After-birth guides by the baby\'s age in months.',
    fields: [
      { name: 'month_from', label: 'From month', type: 'number' },
      { name: 'month_to', label: 'To month', type: 'number' },
      { name: 'category', label: 'Topic', type: 'select', default: 'feeding', options: ['feeding', 'care', 'sleep', 'development', 'safety'].map((c) => [c, c]) },
      { name: 'title', label: 'Title' },
      { name: 'content', label: 'Content', type: 'textarea' },
    ],
    columns: [
      ['Months', (g) => g.month_from + ' - ' + g.month_to],
      ['Topic', (g) => <span className="badge">{g.category}</span>],
      ['Guide', (g) => detail(g.title, g.content)],
    ],
  },
  quiz: {
    type: 'quiz', title: 'Quiz Questions',
    fields: [
      { name: 'question', label: 'Question', type: 'textarea' },
      { name: 'option_a', label: 'Option A' },
      { name: 'option_b', label: 'Option B' },
      { name: 'option_c', label: 'Option C' },
      { name: 'option_d', label: 'Option D' },
      { name: 'correct', label: 'Correct option', type: 'select', default: 'a', options: ['a', 'b', 'c', 'd'].map((c) => [c, c.toUpperCase()]) },
      { name: 'explanation', label: 'Explanation shown after answering', type: 'textarea', optional: true },
    ],
    columns: [
      ['Question', (q) => detail(q.question, 'Answer: ' + q['option_' + q.correct])],
    ],
  },
  videos: {
    type: 'videos', title: 'Videos',
    help: 'YouTube videos shown to parents on the Videos page. Paste the normal YouTube link.',
    fields: [
      { name: 'title', label: 'Title' },
      { name: 'url', label: 'YouTube link', type: 'url' },
      { name: 'category', label: 'Topic', type: 'select', default: 'baby', options: [['pregnancy', 'Pregnancy'], ['baby', 'Baby care'], ['wellbeing', 'Wellbeing']] },
    ],
    columns: [['Topic', (v) => <span className="badge">{v.category}</span>], ['Video', (v) => detail(v.title, v.url)]],
  },
  'site-photos': {
    type: 'site-photos', title: 'First Page Photos',
    help: 'Photos shown in the row of pictures on the first page (for example oil massage, bath time). If you add none, the row is not shown. Three photos look best. The big first-page picture is set in Site Settings.',
    fields: [
      { name: 'title', label: 'Caption' },
      { name: 'sort_order', label: 'Position (1 = first)', type: 'number', default: 1, optional: true },
      { name: 'photo', label: 'Photo', type: 'image', photo: { size: 800, square: false } },
    ],
    columns: [['Photo', (p) => <img className="thumb" src={p.photo} alt="" />], ['Caption', (p) => p.title]],
  },
  creators: {
    type: 'creators', title: 'Creators',
    help: 'The people shown on the Creators page. Add as many as you like. The heading text of that page is in Site Settings.',
    fields: [
      { name: 'name', label: 'Name' },
      { name: 'role', label: 'Role (e.g. Team lead, Designer)', optional: true },
      { name: 'details', label: 'Details (class, register no., college)', optional: true },
      { name: 'email', label: 'Email', type: 'email', optional: true },
      { name: 'phone', label: 'Phone', optional: true },
      { name: 'link', label: 'Link (LinkedIn, GitHub...)', type: 'url', optional: true },
      { name: 'sort_order', label: 'Position (1 = first)', type: 'number', default: 1, optional: true },
      { name: 'photo', label: 'Photo', type: 'image', optional: true },
      { name: 'about', label: 'About', type: 'textarea', optional: true },
    ],
    columns: [
      ['Photo', (c) => (c.photo ? <img className="thumb" src={c.photo} alt="" /> : <span className="avatar small">{c.name[0].toUpperCase()}</span>)],
      ['Person', (c) => detail(c.name, [c.role, c.details, c.email, c.phone].filter(Boolean).join(' · '))],
    ],
  },
  affirmations: {
    type: 'affirmations', title: 'Affirmations',
    help: 'One is shown on the home page each day.',
    fields: [{ name: 'text', label: 'Affirmation' }],
    columns: [['Text', (a) => a.text]],
  },
};

export default function AdminContent({ type }) {
  // key makes React start a fresh form when the admin moves to another content page
  return <CrudPage key={type} config={CONTENT[type]} />;
}
