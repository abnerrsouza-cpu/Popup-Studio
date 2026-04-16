// /api/popups/publish
// POST { id } -> injeta o loader.js na loja via API de Scripts da Nuvemshop
// Se a loja jÃ¡ tem UM script nosso ativo (de outro pop-up), reusa (o loader decide qual pop-up exibir).

import { supabase } from '../../lib/supabase.js';
import { requireStore, readJson, handleOptions, setCors } from '../../lib/auth.js';
import { createScript, listScripts } from '../../lib/nuvemshop.js';

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

    const appUrl = process.env.APP_URL || 'https://popup-studio.vercel.app';
    const src    = `${appUrl}/loader.js?store_id=${store.store_id}`;

    // Se jÃ¡ existe script nosso injetado (de outro pop-up), reusa o mesmo script_id
    let scriptId = null;
    try {
      const existing = await listScripts(store.store_id, store.access_token);
      const arr = Array.isArray(existing) ? existing : (existing?.scripts || []);
      const ours = arr.find(s => (s.src || '').startsWith(`${appUrl}/loader.js`));
      if (ours) scriptId = ours.id;
    } catch (e) {
      console.warn('[publish] listScripts falhou:', e.message);
    }

    if (!scriptId) {
      const created = await createScript(store.store_id, store.access_token, {
        src,
        event: 'onload',
        where: 'store',
        type:  'javascript',
      });
      scriptId = created?.id;
    }

    // Marca pop-up como publicado + guarda script_id
    const { data: updated, error: updErr } = await supabase
      .from('popups')
      .update({
        status:       'published',
        script_id:    scriptId || null,
        published_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('store_id', store.store_id)
      .select()
      .single();
    if (updErr) return res.status(500).json({ error: updErr.message });

    return res.status(200).json({ popup: updated, script_id: scriptId });
  } catch (err) {
    console.error('[publish] erro:', err);
    return res.status(500).json({ error: 'publish_failed', message: err.message });
  }
}
