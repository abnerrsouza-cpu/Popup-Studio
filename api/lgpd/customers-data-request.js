// LGPD: Customer data request webhook
// Called when a customer requests their stored data
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  console.log('customers-data-request webhook received', JSON.stringify(req.body));
  // In production: return customer data from leads table
  res.status(200).json({ message: 'ok', data: [] });
}
