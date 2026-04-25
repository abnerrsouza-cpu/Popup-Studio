// /api/me
// Retorna dados da loja logada (usado pelo painel para saber se o usuário está autenticado).
// SEGURANÇA: CORS restrito, security headers. Não expõe access_token.

import { requireStore, handleOptions, setCorsAuthenticated } from '../lib/auth.js';
import { setSecurityHeaders } from '../lib/security.js';

export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (handleOptions(req, res, true)) return;
  setCorsAuthenticated(res);

  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const store = await requireStore(req, res);
  if (!store) return;

  // Não expõe access_token nem dados sensíveis.
  res.status(200).json({
    store_id:   store.store_id,
    shop_name:  store.shop_name,
    shop_url:   store.shop_url,
    plan_name:  store.plan_name,
    installed_at: store.installed_at,
  });
}
