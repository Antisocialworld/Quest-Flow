import { kv } from '@vercel/kv';

var DURATIONS = {
  '5': 5 * 60 * 1000,
  '30': 30 * 60 * 1000,
  '1800': 30 * 60 * 1000,
  '3600': 60 * 60 * 1000,
  'tomorrow': 24 * 60 * 60 * 1000
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  var reminderId = body.reminderId;
  var duration = body.duration;

  if (!reminderId || !duration) {
    return res.status(400).json({ error: 'Missing reminderId or duration' });
  }

  var reminders = await kv.get('reminders') || [];
  var idx = -1;
  for (var i = 0; i < reminders.length; i++) {
    if (reminders[i].id === reminderId) { idx = i; break; }
  }

  if (idx === -1) return res.status(404).json({ error: 'Reminder not found' });

  var ms = DURATIONS[duration];
  if (!ms) {
    var custom = parseInt(duration, 10);
    ms = isNaN(custom) ? 5 * 60 * 1000 : custom * 1000;
  }

  reminders[idx].snoozedUntil = new Date(Date.now() + ms).toISOString();
  reminders[idx].notified = {};

  await kv.set('reminders', reminders);
  res.json({ ok: true, snoozedUntil: reminders[idx].snoozedUntil });
}
