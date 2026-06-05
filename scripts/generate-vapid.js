const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n=== VAPID Keys Generated ===\n');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('\nAdd these to your Vercel environment variables:\n');
console.log('  vercel env add VAPID_PUBLIC_KEY');
console.log('  vercel env add VAPID_PRIVATE_KEY');
console.log('\nAlso set:\n');
console.log('  vercel env add VAPID_SUBJECT (e.g. mailto:you@example.com)\n');
