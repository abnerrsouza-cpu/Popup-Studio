// /api/popups
// GET  -> lista todos os pop-ups da loja logada
// POST -> cria um novo pop-up (draft por default)
// SEGURANÇA: CORS restrito, security headers, validação.

import { supabase } from '../../lib/supabase.js';
import { requireStore, readJson, handleOptions, setCorsAuthenticated } from '../../lib/auth.js';
import { setSecurityHeaders } from '../../lib/security.js';
import { sanitize, isValidGameType, sanitizePayload } from '../../lib/validate.js';

export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (handleOptions(req, res, true)) return;
  setCorsAuthenticated(res);

  const store = await requireStore(req, res);
  if (!store) return;

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('popups')
      .select('*')
      .eq('store_id', store.store_id)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'database_error' });
    return res.status(200).json({ popups: data });
  }

  if (req.method === 'POST') {
    try {
      const body = await readJson(req);
      const { name, game_type, config } = body;

      if (!name || typeof name !== 'string' || name.trim().length < 1) {
        return res.status(400).json({ error: 'name is required' });
      }
      if (!game_type || !isValidGameType(game_type)) {
        return res.status(400).json({ error: 'invalid game_type' });
      }

      const { data, error } = await supabase
        .from('popups')
        .insert({
          store_id:  store.store_id,
          name:      sanitize(name, 200),
          game_type,
          config:    sanitizePayload(config),
          status:    'draft',
        })
        .select()
        .single();
      if (error) return res.status(500).json({ error: 'database_error' });
      return res.status(201).json({ popup: data });
    } catch (e) {
      return res.status(400).json({ error: 'invalid_request' });
    }
  }

  res.status(405).json({ error: 'method_not_allowed' });
}
