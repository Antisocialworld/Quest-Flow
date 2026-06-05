import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  var reminders = body.reminders || [];

  var enriched = reminders
    .filter(function (r) { return r.date && r.time; })
    .map(function (r) {
      return {
        id: r.id,
        taskId: r.taskId,
        taskText: r.taskText || '',
        date: r.date,
        time: r.time,
        status: r.status || 'pending',
        notified: r.notified || {},
        snoozedUntil: r.snoozedUntil || null
      };
    });

  await kv.set('reminders', enriched);
  res.json({ ok: true, count: enriched.length });
}
