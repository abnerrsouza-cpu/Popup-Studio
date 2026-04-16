// /api/popups/[id]
// GET    -> detalhe
// PUT    -> atualiza campos (name, config, etc.)
// DELETE -> remove do banco (despublica antes se estava publicado)

import { supabase } from '../../lib/supabase.js';
import { requireStore, readJson, handleOptions, setCors } from '../../lib/auth.js';
import { deleteScript } from '../../lib/nuvemshop.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCors(res);

  const store = await requireStore(req, res);
  if (!store) return;

  const { id } = req.query || {};
  if (!id) return res.status(400).json({ error: 'missing_id' });

  // Busca garantindo que pertence Ã  loja logada
  const { data: popup, error: fetchErr } = await supabase
    .from('popups')
    .select('*')
    .eq('id', id)
    .eq('store_id', store.store_id)
    .single();

  if (fetchErr || !popup) return res.status(404).json({ error: 'popup_not_found' });

  if (req.method === 'GET') {
    return res.status(200).json({ popup });
  }

  if (req.method === 'PUT') {
    try {
      const body = await readJson(req);
      const patch = {};
      if ('name'      in body) patch.name      = body.name;
      if ('game_type' in body) patch.game_type = body.game_type;
      if ('config'    in body) patch.config    = body.config;
      // status sÃ³ muda via publish/unpublish
      const { data, error } = await supabase
        .from('popups')
        .update(patch)
        .eq('id', id)
        .eq('store_id', store.store_id)
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ popup: data });
    } catch (e) {
      return res.status(400).json({ error: 'invalid_json', message: e.message });
    }
  }

  if (req.method === 'DELETE') {
    // Se tem script publicado, remove da loja primeiro
    if (popup.script_id) {
      try {
        await deleteScript(store.store_id, store.access_token, popup.script_id);
      } catch (e) {
        console.warn('[popups/delete] falha ao remover script da loja:', e.message);
      }
    }
    const { error } = await supabase
      .from('popups')
      .delete()
      .eq('id', id)
      .eq('store_id', store.store_id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'method_not_allowed' });
}
