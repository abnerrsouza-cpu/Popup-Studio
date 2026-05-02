// /api/leads
// Endpoint AUTENTICADO para listar leads da loja logada.
// Suporta paginação, filtro por popup_id e busca por texto.

import { supabase } from '../../lib/supabase.js';
import { requireStore, handleOptions, setCorsAuthenticated } from '../../lib/auth.js';
import { setSecurityHeaders } from '../../lib/security.js';

export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (handleOptions(req, res, true)) return;
  setCorsAuthenticated(res);

  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });

  const store = await requireStore(req, res);
  if (!store) return;

  try {
    const { search, popup_id, limit, offset, count, since } = req.query || {};

    // Count-only mode (para dashboard)
    if (count === '1') {
      const { count: total, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.store_id);
      if (error) throw error;
      return res.status(200).json({ count: total || 0 });
    }

    // Build query
    let query = supabase
      .from('leads')
      .select('*')
      .eq('store_id', store.store_id)
      .order('created_at', { ascending: false });

    // Filtro por popup
    if (popup_id) {
      query = query.eq('popup_id', popup_id);
    }

    // Filtro por data (desde)
    if (since) {
      query = query.gte('created_at', since);
    }

    // Busca por texto (nome ou email)
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Paginação
    const lim = Math.min(parseInt(limit) || 500, 1000);
    const off = parseInt(offset) || 0;
    query = query.range(off, off + lim - 1);

    const { data, error } = await query;
    if (error) throw error;

    return res.status(200).json({ leads: data || [] });
  } catch (e) {
    console.error('[leads] Error:', e.message);
    return res.status(500).json({ error: 'database_error' });
  }
}
