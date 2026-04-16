// LGPD: Customers redact webhook
// Called when a customer requests their data deletion
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  console.log('customers-redact webhook received', JSON.stringify(req.body));
  // In production: delete customer data (leads table) from Supabase
  res.status(200).json({ message: 'ok' });
}
