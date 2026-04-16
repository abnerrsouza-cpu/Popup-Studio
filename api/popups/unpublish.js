// /api/popups/unpublish
// POST { id } -> marca o popup como draft no Supabase.
// O loader.js é auto-instalado via Roteiros do portal de parceiros (script_id 6043),
// então não precisamos deletar scripts da API de Scripts da Nuvemshop.

import { supabase } from '../../lib/supabase.js';
import { requireStore, readJson, handleOptions, setCors } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCors(res);
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

    // Marca como draft
    const { data: updated, error: updErr } = await supabase
      .from('popups')
      .update({
        status: 'draft',
        is_published: false,
      })
      .eq('id', id)
      .eq('store_id', store.store_id)
      .select()
      .single();
    if (updErr) return res.status(500).json({ error: updErr.message });

    return res.status(200).json({ popup: updated });
  } catch (err) {
    console.error('[unpublish] erro:', err);
    return res.status(500).json({ error: 'unpublish_failed', message: err.message });
  }
}
// /api/popups/unpublish
// POST { id } -> marca o popup como draft no Supabase.
// O loader.js é auto-instalado via Roteiros do portal de parceiros (script_id 6043),
// então não precisamos deletar scripts da API de Scripts da Nuvemshop.

import { supabase } from '../../lib/supabase.js';
import { requireStore, readJson, handleOptions, setCors } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCors(res);
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

    // Marca como draft
    const { data: updated, error: updErr } = await supabase
      .from('popups')
      .update({
        status: 'draft',
        is_published: false,
      })
      .eq('id', id)
      .eq('store_id', store.store_id)
      .select()
      .single();
    if (updErr) return res.status(500).json({ error: updErr.message });

    return res.status(200).json({ popup: updated });
  } catch (err) {
    console.error('[unpublish] erro:', err);
    return res.status(500).json({ error: 'unpublish_failed', message: err.message });
  }
}
// /api/popups/unpublish
// POST { id } -> marca o popup como draft no Supabase.
// O loader.js é auto-instalado via Roteiros do portal de parceiros (script_id 6043),
// então não precisamos deletar scripts da API de Scripts da Nuvemshop.

import { supabase } from '../../lib/supabase.js';
import { requireStore, readJson, handleOptions, setCors } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCors(res);
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

    // Marca como draft
    const { data: updated, error: updErr } = await supabase
      .from('popups')
      .update({
        status: 'draft',
        is_published: false,
      })
      .eq('id', id)
      .eq('store_id', store.store_id)
      .select()
      .single();
    if (updErr) return res.status(500).json({ error: updErr.message });

    return res.status(200).json({ popup: updated });
  } catch (err) {
    console.error('[unpublish] erro:', err);
    return res.status(500).json({ error: 'unpublish_failed', message: err.message });
  }
}
// /api/popups/unpublish
// POST { id } -> marca o popup como draft no Supabase.
// O loader.js é auto-instalado via Roteiros do portal de parceiros (script_id 6043),
// então não precisamos deletar scripts da API de Scripts da Nuvemshop.

import { supabase } from '../../lib/supabase.js';
import { requireStore, readJson, handleOptions, setCors } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCors(res);
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

    // Marca como draft
    const { data: updated, error: updErr } = await supabase
      .from('popups')
      .update({ status: 'draft' })
      .eq('id', id)
      .eq('store_id', store.store_id)
      .select()
      .single();
    if (updErr) return res.status(500).json({ error: updErr.message });

    return res.status(200).json({ popup: updated });
  } catch (err) {
    console.error('[unpublish] erro:', err);
    return res.status(500).json({ error: 'unpublish_failed', message: err.message });
  }
}
