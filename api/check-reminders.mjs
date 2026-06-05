import { kv } from '@vercel/kv';
import webpush from 'web-push';

var VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:questflow@example.com';
var VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
var VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;

function minutesUntil(dateStr, timeStr) {
  var d = new Date(dateStr + 'T' + (timeStr || '00:00'));
  return Math.round((d.getTime() - Date.now()) / 60000);
}

function buildPayload(reminder, type) {
  var templates = {
    upcoming: {
      title: '\u23F0 Upcoming Reminder',
      body: '\u23F0 Reminder: ' + reminder.taskText + ' is due soon. Ready to tackle it?'
    },
    due: {
      title: '\uD83D\uDECE\uFE0F Due Now',
      body: '\uD83D\uDECE\uFE0F ' + reminder.taskText + ' is due now! Let\u2019s get it done.'
    },
    overdue: {
      title: '\uD83D\uDE2C Overdue',
      body: '\uD83D\uDE2C Overdue: ' + reminder.taskText + '. Better late than never \u2014 start now?'
    }
  };

  var t = templates[type] || templates.due;
  return JSON.stringify({
    title: t.title,
    body: t.body,
    tag: 'reminder-' + reminder.id + '-' + type,
    reminderId: reminder.id
  });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (req.headers['x-vercel-cron'] !== '1') return res.status(403).json({ error: 'Unauthorized' });

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return res.status(500).json({ error: 'VAPID keys not configured' });
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

  var subscription = await kv.get('push-subscription');
  if (!subscription) return res.json({ checked: 0, sent: 0, reason: 'No subscription' });

  var reminders = await kv.get('reminders') || [];
  var sent = 0;

  for (var i = 0; i < reminders.length; i++) {
    var r = reminders[i];
    if (r.status === 'completed') continue;
    if (r.snoozedUntil && new Date(r.snoozedUntil) > new Date()) continue;
    if (!r.date || !r.time) continue;

    var min = minutesUntil(r.date, r.time);
    var type = null;

    if (min >= 0 && min <= 15 && !r.notified.upcoming) {
      type = 'upcoming';
    } else if (min >= -2 && min <= 1 && !r.notified.due) {
      type = 'due';
    } else if (min < -15 && !r.notified.overdue) {
      type = 'overdue';
    }

    if (type) {
      var payload = buildPayload(r, type);
      try {
        await webpush.sendNotification(subscription, payload);
        sent++;
      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await kv.del('push-subscription');
          return res.json({ checked: reminders.length, sent: sent, error: 'Subscription expired' });
        }
      }

      r.notified = r.notified || {};
      r.notified[type] = true;
    }
  }

  await kv.set('reminders', reminders);
  res.json({ checked: reminders.length, sent: sent });
}
