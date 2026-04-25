// /api/popups/unpublish
// POST { id } -> marca pop-up como draft. Se nenhum outro pop-up publicado da loja
// usa o script, remove o script da loja via API de Scripts.

import { supabase } from '../../lib/supabase.js';
import { requireStore, readJson, handleOptions, setCorsAuthenticated } from '../../lib/auth.js';
import { deleteScript } from '../../lib/nuvemshop.js';
import { setSecurityHeaders } from '../../lib/security.js';

export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (handleOptions(req, res, true)) return;
  setCorsAuthenticated(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const store = await requireStore(req, res);
  if (!store) return;

  try {
    const { id } = await readJson(req);
    if (!id) return res.status(400).json({ error: 'missing_id' });

    const { data: popup, error: fetchErr } = await supabase
      .from('popups')
      .select('*')
      .eq('id', id)
      .eq('store_id', store.store_id)
      .single();
    if (fetchErr || !popup) return res.status(404).json({ error: 'popup_not_found' });

    const scriptId = popup.script_id;

    // Marca como draft
    const { data: updated, error: updErr } = await supabase
      .from('popups')
      .update({ status: 'draft', published_at: null, script_id: null })
      .eq('id', id)
      .eq('store_id', store.store_id)
      .select()
      .single();
    if (updErr) return res.status(500).json({ error: updErr.message });

    // Verifica se ainda existem outros publicados com esse script_id
    if (scriptId) {
      const { count } = await supabase
        .from('popups')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', store.store_id)
        .eq('status', 'published');

      if ((count || 0) === 0) {
        try {
          await deleteScript(store.store_id, store.access_token, scriptId);
        } catch (e) {
          console.warn('[unpublish] falha ao deletar script:', e.message);
        }
      }
    }

    return res.status(200).json({ popup: updated });
  } catch (err) {
    console.error('[unpublish] erro:', err);
    return res.status(500).json({ error: 'unpublish_failed', message: err.message });
  }
}
