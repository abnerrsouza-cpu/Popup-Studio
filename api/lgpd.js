// LGPD compliance webhooks (combined handler - Hobby plan = max 12 functions)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const action = req.url.replace(/\?.*$/, '').split('/').pop();
  console.log('LGPD webhook:', action, JSON.stringify(req.body).substring(0, 200));
  // Acknowledge Nuvemshop's LGPD webhooks
  // In production: implement data deletion/export from Supabase as needed
  res.status(200).json({ received: true, action });
}
