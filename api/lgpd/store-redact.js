// LGPD: Store redact webhook
// Called when a store owner requests data deletion
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  // Log the request for audit trail
  console.log('store-redact webhook received', JSON.stringify(req.body));
  // In production: delete store data from Supabase
  res.status(200).json({ message: 'ok' });
}
