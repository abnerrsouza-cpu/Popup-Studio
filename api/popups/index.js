// /api/popups
// GET  -> lista todos os pop-ups da loja logada
// POST -> cria um novo pop-up (draft por default)

import { supabase } from '../../lib/supabase.js';
import { requireStore, readJson, handleOptions, setCors } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCors(res);

  const store = await requireStore(req, res);
  if (!store) return;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('popups')
      .select('*')
      .eq('store_id', store.store_id)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ popups: data });
  }

  if (req.method === 'POST') {
    try {
      const body = await readJson(req);
      const { name, game_type, config } = body;
      if (!name || !game_type) {
        return res.status(400).json({ error: 'name e game_type sÃ£o obrigatÃ³rios' });
      }
      const { data, error } = await supabase
        .from('popups')
        .insert({
          store_id:  store.store_id,
          name,
          game_type,
          config:    config || {},
          status:    'draft',
        })
        .select()
        .single();
      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ popup: data });
    } catch (e) {
      return res.status(400).json({ error: 'invalid_json', message: e.message });
    }
  }

  res.status(405).json({ error: 'method_not_allowed' });
}
