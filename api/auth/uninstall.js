// /api/auth/uninstall
// Webhook chamado pela Nuvemshop quando o lojista desinstala o app.
// SEGURANÇA: rate limit, validação de store_id, erro genérico.
// NOTA: Nuvemshop não envia assinatura HMAC nos webhooks.
// Validamos o store_id contra o banco antes de agir.

import { markStoreUninstalled, getStore } from '../../lib/supabase.js';
import { readJson } from '../../lib/auth.js';
import { rateLimitStrict } from '../../lib/rateLimit.js';
import { setSecurityHeaders, safeErrorMessage } from '../../lib/security.js';
import { isValidStoreId } from '../../lib/validate.js';

export default async function handler(req, res) {
  setSecurityHeaders(res);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  // Rate limit estrito: 10/min (webhook não deve vir em rajada)
  if (rateLimitStrict(req, res)) return;

  try {
    const body = await readJson(req);
    const storeId = body?.store_id || body?.user_id;

    if (!storeId || !isValidStoreId(storeId)) {
      return res.status(400).json({ error: 'invalid_store_id' });
    }

    // Verifica se a loja existe antes de marcar como desinstalada
    const store = await getStore(Number(storeId));
    if (!store) {
      return res.status(404).json({ error: 'store_not_found' });
    }

    await markStoreUninstalled(Number(storeId));
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[uninstall] erro:', err);
    res.status(500).json({ error: 'server_error' });
  }
}
