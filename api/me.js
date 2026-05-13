// /api/me
// Retorna dados da loja logada (GET) e permite deletar leads (DELETE).
// SEGURANÇA: CORS restrito, security headers. Não expõe access_token.

import { supabase } from '../lib/supabase.js';
import { requireStore, handleOptions, setCorsAuthenticated } from '../lib/auth.js';
import { setSecurityHeaders } from '../lib/security.js';

export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (handleOptions(req, res, true)) return;
  setCorsAuthenticated(res);

  const store = await requireStore(req, res);
  if (!store) return;

  // GET — retorna dados da loja
  if (req.method === 'GET') {
    return res.status(200).json({
      store_id:   store.store_id,
      shop_name:  store.shop_name,
      shop_url:   store.shop_url,
      plan_name:  store.plan_name,
      status:     store.status,
      installed_at: store.installed_at,
    });
  }

  // DELETE — deleta um lead (query: ?lead_id=xxx)
  if (req.method === 'DELETE') {
    const leadId = parseInt(req.query.lead_id, 10);
    if (!leadId || isNaN(leadId) || leadId <= 0) {
      return res.status(400).json({ error: 'invalid_lead_id' });
    }
    try {
      const { data: lead, error: fetchError } = await supabase
        .from('leads')
        .select('id, store_id')
        .eq('id', leadId)
        .single();
      if (fetchError || !lead) {
        return res.status(404).json({ error: 'lead_not_found' });
      }
      if (lead.store_id !== store.store_id) {
        return res.status(403).json({ error: 'forbidden' });
      }
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);
      if (deleteError) throw deleteError;
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('[me/delete-lead] Error:', e.message);
      return res.status(500).json({ error: 'database_error' });
    }
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}
