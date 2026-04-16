// /api/public/config?store_id=XXXX
// Endpoint PÃBLICO (sem cookie) chamado pelo loader.js na loja do cliente.
// Retorna apenas os pop-ups com status=published da loja.

import { supabase } from '../../lib/supabase.js';
import { setCors, handleOptions } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCors(res); // pÃºblico mesmo
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300'); // 1min cliente / 5min CDN

  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const storeId = Number(req.query?.store_id || new URL(req.url, `http://${req.headers.host}`).searchParams.get('store_id'));
  if (!storeId) return res.status(400).json({ error: 'missing_store_id' });

  const { data: store, error: storeErr } = await supabase
    .from('stores')
    .select('store_id, status')
    .eq('store_id', storeId)
    .single();
  if (storeErr || !store || store.status !== 'active') {
    return res.status(200).json({ popups: [] }); // nÃ£o expÃµe se a loja nÃ£o existe
  }

  const { data: popups, error } = await supabase
    .from('popups')
    .select('id, name, game_type, config')
    .eq('store_id', storeId)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ store_id: storeId, popups: popups || [] });
}
