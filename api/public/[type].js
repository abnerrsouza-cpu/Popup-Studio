// /api/public/[type]
// Handles both /api/public/event and /api/public/lead in one serverless function.
// Vercel routes /api/public/event and /api/public/lead here (config.js static takes priority).

import { supabase } from '../../lib/supabase.js';
import { setCors, handleOptions, readJson } from '../../lib/auth.js';

const ALLOWED_EVENTS = new Set(['impression', 'play', 'win', 'close', 'coupon_used']);

async function handleEvent(req, res, body) {
  const { store_id, popup_id, event_type, payload } = body;
  if (!store_id || !event_type) return res.status(400).json({ error: 'missing_fields' });
  if (!ALLOWED_EVENTS.has(event_type)) return res.status(400).json({ error: 'invalid_event_type' });

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
}

async function handleLead(req, res, body) {
  const { store_id, popup_id, email, phone, name, coupon, prize, payload } = body;
  if (!store_id) return res.status(400).json({ error: 'missing_store_id' });

  const { data, error } = await supabase
    .from('leads')
    .insert({
      store_id: Number(store_id),
      popup_id: popup_id || null,
      email:    email  || null,
      phone:    phone  || null,
      name:     name   || null,
      coupon:   coupon || null,
      prize:    prize  || null,
      payload:  payload || {},
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ ok: true, lead_id: data.id });
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCors(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const { type } = req.query;

  try {
    const body = await readJson(req);

    if (type === 'event') return await handleEvent(req, res, body);
    if (type === 'lead')  return await handleLead(req, res, body);

    return res.status(404).json({ error: 'unknown_type' });
  } catch (e) {
    return res.status(400).json({ error: 'invalid_json', message: e.message });
  }
}
