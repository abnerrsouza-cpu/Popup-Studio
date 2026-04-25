// /api/public/event
// Endpoint PÚBLICO para o loader.js registrar eventos.
// SEGURANÇA: rate limit, validação rigorosa.

import { supabase } from '../../lib/supabase.js';
import { setCors, handleOptions, readJson } from '../../lib/auth.js';
import { rateLimit } from '../../lib/rateLimit.js';
import { setSecurityHeaders } from '../../lib/security.js';
import { isValidStoreId, isValidEventType, sanitizePayload } from '../../lib/validate.js';

export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (handleOptions(req, res)) return;
  setCors(res);

  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  // Rate limit: 60 eventos/min por IP
  if (rateLimit(req, res, 60)) return;

  try {
    const body = await readJson(req);
    const { store_id, popup_id, event_type, payload } = body;

    if (!store_id || !isValidStoreId(store_id)) {
      return res.status(400).json({ error: 'invalid_store_id' });
    }
    if (!event_type || !isValidEventType(event_type)) {
      return res.status(400).json({ error: 'invalid_event_type' });
    }

    const { error } = await supabase
      .from('events')
      .insert({
        store_id:   Number(store_id),
        popup_id:   popup_id || null,
        event_type,
        payload:    sanitizePayload(payload),
      });
    if (error) return res.status(500).json({ error: 'database_error' });

    return res.status(201).json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: 'invalid_request' });
  }
}
