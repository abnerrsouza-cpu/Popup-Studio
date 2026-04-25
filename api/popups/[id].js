// /api/popups/[id]
// GET    -> detalhe
// PUT    -> atualiza campos (name, config, etc.)
// DELETE -> remove do banco (despublica antes se estava publicado)
// SEGURANÇA: CORS restrito, security headers, validação, erro genérico.

import { supabase } from '../../lib/supabase.js';
import { requireStore, readJson, handleOptions, setCorsAuthenticated } from '../../lib/auth.js';
import { deleteScript } from '../../lib/nuvemshop.js';
import { setSecurityHeaders } from '../../lib/security.js';
import { sanitize, isValidGameType, sanitizePayload } from '../../lib/validate.js';

export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (handleOptions(req, res, true)) return;
  setCorsAuthenticated(res);

  const store = await requireStore(req, res);
  if (!store) return;

  const { id } = req.query || {};
  if (!id || typeof id !== 'string') return res.status(400).json({ error: 'missing_id' });

  // Valida formato UUID básico
  if (!/^[0-9a-f-]{36}$/i.test(id)) return res.status(400).json({ error: 'invalid_id' });

  // Busca garantindo que pertence à loja logada
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
      if ('name'      in body) patch.name      = sanitize(body.name, 200);
      if ('game_type' in body) {
        if (!isValidGameType(body.game_type)) return res.status(400).json({ error: 'invalid_game_type' });
        patch.game_type = body.game_type;
      }
      if ('config'    in body) patch.config    = sanitizePayload(body.config);

      const { data, error } = await supabase
        .from('popups')
        .update(patch)
        .eq('id', id)
        .eq('store_id', store.store_id)
        .select()
        .single();
      if (error) return res.status(500).json({ error: 'database_error' });
      return res.status(200).json({ popup: data });
    } catch (e) {
      return res.status(400).json({ error: 'invalid_request' });
    }
  }

  if (req.method === 'DELETE') {
    if (popup.script_id) {
      try {
        await deleteScript(store.store_id, store.access_token, popup.script_id);
      } catch (e) {
        console.warn('[popups/delete] falha ao remover script da loja');
      }
    }
    const { error } = await supabase
      .from('popups')
      .delete()
      .eq('id', id)
      .eq('store_id', store.store_id);
    if (error) return res.status(500).json({ error: 'database_error' });
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'method_not_allowed' });
}
