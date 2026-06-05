import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  var body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  var subscription = body.subscription;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Missing subscription' });
  }

  await kv.set('push-subscription', subscription);
  res.json({ ok: true });
}
