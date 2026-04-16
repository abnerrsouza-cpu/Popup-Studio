// /api/me
// Retorna dados da loja logada (usado pelo painel para saber se o usuÃ¡rio estÃ¡ autenticado).

import { requireStore, handleOptions, setCors } from '../lib/auth.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCors(res);

  const store = await requireStore(req, res);
  if (!store) return;

  // NÃ£o expÃµe access_token nem dados sensÃ­veis.
  res.status(200).json({
    store_id:   store.store_id,
    shop_name:  store.shop_name,
    shop_url:   store.shop_url,
    plan_name:  store.plan_name,
    installed_at: store.installed_at,
  });
}
