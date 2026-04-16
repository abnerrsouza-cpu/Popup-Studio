// /api/auth/uninstall
// Webhook chamado pela Nuvemshop quando o lojista desinstala o app.
// Marca a loja como uninstalled (mantÃ©m histÃ³rico para analytics).

import { markStoreUninstalled } from '../../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    let body = req.body;
    if (!body) {
      body = await new Promise((resolve, reject) => {
        let d = ''; req.on('data', c => d += c);
        req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch (e) { reject(e); } });
        req.on('error', reject);
      });
    }

    const storeId = body?.store_id || body?.user_id;
    if (!storeId) {
      res.status(400).json({ error: 'missing store_id' });
      return;
    }

    await markStoreUninstalled(Number(storeId));
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[uninstall] erro:', err);
    res.status(500).json({ error: 'server_error', message: err.message });
  }
}
