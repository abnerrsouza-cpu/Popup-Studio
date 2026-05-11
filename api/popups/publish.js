// /api/popups/publish
// POST { id } -> marca o pop-up como publicado no Supabase.
// O script template (popup-studio-loader) é auto-instalado na Nuvemshop,
// então NÃO precisamos criar associação via API — o loader.js já roda em todas as lojas.

import { supabase } from '../../lib/supabase.js';
import { requireStore, readJson, handleOptions, setCorsAuthenticated } from '../../lib/auth.js';
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

        // Verifica se o pop-up existe e pertence à loja
        const { data: popup, error: fetchErr } = await supabase
            .from('popups')
            .select('*')
            .eq('id', id)
            .eq('store_id', store.store_id)
            .single();

        if (fetchErr || !popup) return res.status(404).json({ error: 'popup_not_found' });

        // Script template ID (auto-instalado, apenas para referência)
        const scriptTemplateId = process.env.NUVEMSHOP_SCRIPT_ID
            ? parseInt(process.env.NUVEMSHOP_SCRIPT_ID, 10)
            : null;

        // Marca pop-up como publicado
        const { data: updated, error: updErr } = await supabase
            .from('popups')
            .update({
                status: 'published',
                script_id: scriptTemplateId,
                published_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('store_id', store.store_id)
            .select()
            .single();

        if (updErr) return res.status(500).json({ error: updErr.message });

        return res.status(200).json({ popup: updated, script_id: scriptTemplateId });

    } catch (err) {
        console.error('[publish] erro:', err.message);
        return res.status(500).json({ error: 'publish_failed', message: err.message });
    }
}
