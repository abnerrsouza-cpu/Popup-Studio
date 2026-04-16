// /api/public/event
// Endpoint PÃBLICO para o loader.js registrar eventos (impression, play, win).

import { supabase } from '../../lib/supabase.js';
import { setCors, handleOptions, readJson } from '../../lib/auth.js';

const ALLOWED = new Set(['impression', 'play', 'win', 'close', 'coupon_used']);

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCors(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  try {
    const body = await readJson(req);
    const { store_id, popup_id, event_type, payload } = body;
    if (!store_id || !event_type) return res.status(400).json({ error: 'missing_fields' });
    if (!ALLOWED.has(event_type))  return res.status(400).json({ error: 'invalid_event_type' });

    const { error } = await supabase
      .from('events')
      .insert({
        store_id:   Number(store_id),
        popup_id:   popup_id || null,
        event_type,
        payload:    payload || {},
      });
    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: 'invalid_json', message: e.message });
  }
}
