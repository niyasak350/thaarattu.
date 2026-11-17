// Small helper for talking to the backend.
// Usage: api('/children')  or  api('/children', 'POST', { name: 'Baby' })
export async function api(path, method = 'GET', body) {
  const token = localStorage.getItem('token');
  const res = await fetch('/api' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// "2026-03-01" -> "1 Mar 2026"
export function formatDate(text) {
  if (!text) return '';
  return new Date(text.slice(0, 10) + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// Today's date as "YYYY-MM-DD" (for date inputs)
export function today() {
  const d = new Date();
  return new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// Age in words from a date of birth
export function ageText(dob) {
  const b = new Date(dob + 'T00:00:00'), n = new Date();
  let months = (n.getFullYear() - b.getFullYear()) * 12 + n.getMonth() - b.getMonth();
  if (n.getDate() < b.getDate()) months--;
  if (months < 1) return Math.max(0, Math.floor((n - b) / 86400000)) + ' days';
  if (months < 24) return months + (months === 1 ? ' month' : ' months');
  return Math.floor(months / 12) + ' years';
}
