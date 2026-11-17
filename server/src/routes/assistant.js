// AI Parenting Assistant: sends the chat to Google's Gemini API and returns the reply.
// Needs GEMINI_API_KEY in .env (free key from https://aistudio.google.com/apikey).
const express = require('express');
const db = require('../db');

const router = express.Router();

const RULES = `You are the assistant inside a pregnancy and baby care app for pregnant women, new
mothers and parents of young children.
- Give short, warm, practical answers about pregnancy, food in pregnancy, check-ups, child care,
  feeding, sleep, development, vaccination and postpartum recovery and emotions.
- You are not a doctor. Do not diagnose and do not give medicine doses. For illness, tell the
  parent to see a doctor (the app has a "Hospitals & Doctors" page).
- If a message describes an emergency (trouble breathing, seizure, unresponsive child, heavy
  bleeding) or thoughts of self-harm, say so clearly first and tell them to call 112, or
  Tele-MANAS 14416 for emotional crisis, right away.
- Reply in the language the parent writes in (English, Malayalam or Manglish).
- Politely refuse topics that have nothing to do with parenting, children or the mother's wellbeing.`;

// POST /api/assistant/chat  - body: { messages: [{ role: 'user' | 'assistant', text }] }
router.post('/chat', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'The AI assistant is not set up yet. Add GEMINI_API_KEY to server/.env and restart the server.' });
  }
  const messages = (Array.isArray(req.body.messages) ? req.body.messages : [])
    .filter((m) => m && typeof m.text === 'string' && m.text.trim())
    .slice(-12); // only the recent part of the chat
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Please type a message' });
  }

  // Tell the model about this parent's children so answers fit their age
  const [children] = await db.query(
    `SELECT name, gender, allergies, TIMESTAMPDIFF(MONTH, dob, CURDATE()) AS months
     FROM children WHERE user_id = ?`, [req.user.id]);
  const about = children.length
    ? 'Children of this parent: ' + children.map((c) =>
      `${c.name} (${c.gender}, ${c.months} months old${c.allergies ? ', allergies: ' + c.allergies : ''})`).join('; ')
    : 'This parent has not added a child profile yet.';
  const [preg] = await db.query(
    `SELECT FLOOR(DATEDIFF(CURDATE(), lmp_date) / 7) + 1 AS week FROM pregnancies
     WHERE user_id = ? AND status = 'active' LIMIT 1`, [req.user.id]);
  const pregnancy = preg.length ? ` The user is currently pregnant, week ${preg[0].week}.` : '';

  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const baseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
  try {
    const response = await fetch(`${baseUrl}/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: RULES + '\n' + about + pregnancy }] },
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.text.slice(0, 2000) }],
        })),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      console.error('Gemini error:', data.error?.message || response.status);
      return res.status(502).json({ error: 'The AI service returned an error. Check the API key and model name in server/.env.' });
    }
    const reply = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
    res.json({ reply: reply || 'Sorry, I could not answer that. Please try asking in a different way.' });
  } catch (err) {
    console.error('Gemini request failed:', err.message);
    res.status(502).json({ error: 'Could not reach the AI service. Check your internet connection.' });
  }
});

module.exports = router;
