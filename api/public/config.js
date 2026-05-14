// /api/public/config?store_id=XXXX
// Endpoint PÚBLICO (sem cookie) chamado pelo loader.js na loja do cliente.
// Retorna apenas os pop-ups com status=published da loja.

import { supabase } from '../../lib/supabase.js';
import { setCors, handleOptions } from '../../lib/auth.js';

export default async function handler(req, res) {
    if (handleOptions(req, res)) return;
    setCors(res); // público mesmo
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300'); // 1min cliente / 5min CDN

  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const storeId = Number(req.query?.store_id || new URL(req.url, `http://${req.headers.host}`).searchParams.get('store_id'));
    if (!storeId) return res.status(400).json({ error: 'missing_store_id' });

  const { data: store, error: storeErr } = await supabase
      .from('stores')
      .select('store_id, status')
      .eq('store_id', storeId)
      .single();
    if (storeErr || !store || (store.status !== 'active' && store.status !== 'ativo')) {
          return res.status(200).json({ popups: [] }); // não expõe se a loja não existe
    }

  const { data: popups, error } = await supabase
      .from('popups')
      .select('id, name, game_type, config')
      .eq('store_id', storeId)
      .in('status', ['published', 'publicado'])
      .order('published_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // DEBUG: if no popups found, also query without status filter
  if (!popups || popups.length === 0) {
        const { data: allPopups, error: allErr } = await supabase
          .from('popups')
          .select('id, name, status, store_id, game_type')
          .eq('store_id', storeId);
        return res.status(200).json({
                store_id: storeId,
                popups: popups || [],
                _debug: {
                          store_status: store.status,
                          query_store_id: storeId,
                          query_store_id_type: typeof storeId,
                          all_popups_count: allPopups ? allPopups.length : 0,
                          all_popups: allPopups || [],
                          all_err: allErr ? allErr.message : null
                }
        });
  }

  return res.status(200).json({ store_id: storeId, popups: popups || [] });
}
