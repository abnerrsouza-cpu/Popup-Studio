// /api/popups/publish
// POST { id } -> injeta o loader.js na loja via API de Scripts da Nuvemshop
// Se a loja já tem UM script nosso ativo (de outro pop-up), reusa (o loader decide qual pop-up exibir).

import { supabase } from '../../lib/supabase.js';
import { requireStore, readJson, handleOptions, setCorsAuthenticated } from '../../lib/auth.js';
import { createScript, listScripts } from '../../lib/nuvemshop.js';
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

      const appUrl = process.env.APP_URL || 'https://popup-studio.vercel.app';
        const src    = `${appUrl}/loader.js?store_id=${store.store_id}`;

      // Se já existe script nosso injetado (de outro pop-up), reusa o mesmo script_id
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
              try {
                        const created = await createScript(store.store_id, store.access_token, {
                                    src,
                                    event: 'onfirstinteraction',
                                    where: 'store',
                        });
                        scriptId = created?.id;
              } catch (createErr) {
                        // Script template auto-instalado pela Nuvemshop — não precisa criar manualmente
                if (createErr.status === 422 && /auto.?install/i.test(createErr.message)) {
                            console.log('[publish] Script é auto-instalado, pulando createScript.');
                            scriptId = process.env.NUVEMSHOP_SCRIPT_ID || null;
                } else {
                            throw createErr; // outro erro → propagar
                }
              }
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
        console.error('[publish] erro:', err.message, err.body ? JSON.stringify(err.body) : '');
        return res.status(500).json({ error: 'publish_failed', message: err.message, details: err.body || null });
  }
}
