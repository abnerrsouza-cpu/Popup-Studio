import { supabase } from '../../lib/supabase.js';
import { requireStore, handleOptions, setCorsAuthenticated } from '../../lib/auth.js';
import { setSecurityHeaders } from '../../lib/security.js';

export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (handleOptions(req, res, true)) return;
  setCorsAuthenticated(res);

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const store = await requireStore(req, res);
  if (!store) return;

  const { id } = req.query;
  const leadId = parseInt(id, 10);

  if (!leadId || isNaN(leadId) || leadId <= 0) {
    return res.status(400).json({ error: 'invalid_lead_id' });
  }

  try {
    // Verificar se o lead existe e pertence à loja
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

    // Deletar o lead
    const { error: deleteError } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);

    if (deleteError) throw deleteError;

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[leads/delete] Error:', e.message);
    return res.status(500).json({ error: 'database_error' });
  }
}
