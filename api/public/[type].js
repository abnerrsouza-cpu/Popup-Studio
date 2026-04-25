// /api/public/[type]
// Handles both /api/public/event and /api/public/lead in one serverless function.
// SEGURANÇA: rate limit, validação, sanitização, security headers.

import { supabase } from '../../lib/supabase.js';
import { setCors, handleOptions, readJson } from '../../lib/auth.js';
import { rateLimit } from '../../lib/rateLimit.js';
import { setSecurityHeaders } from '../../lib/security.js';
import {
  sanitize, isValidEmail, isValidPhone,
  isValidStoreId, isValidEventType, sanitizePayload,
} from '../../lib/validate.js';

async function handleEvent(req, res, body) {
  // Rate limit: 60 eventos/min por IP
  if (rateLimit(req, res, 60)) return;

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
      store_id: Number(store_id),
      popup_id: popup_id || null,
      event_type,
      payload: sanitizePayload(payload),
    });
  if (error) return res.status(500).json({ error: 'database_error' });
  return res.status(201).json({ ok: true });
}

async function handleLead(req, res, body) {
  // Rate limit: 20 leads/min por IP
  if (rateLimit(req, res, 20)) return;

  const { store_id, popup_id, email, phone, name, coupon, prize, payload } = body;

  if (!store_id || !isValidStoreId(store_id)) {
    return res.status(400).json({ error: 'invalid_store_id' });
  }
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: 'invalid_email' });
  }
  if (phone && !isValidPhone(phone)) {
    return res.status(400).json({ error: 'invalid_phone' });
  }
  if (!email && !phone) {
    return res.status(400).json({ error: 'email_or_phone_required' });
  }

  const { data, error } = await supabase
    .from('leads')
    .insert({
      store_id: Number(store_id),
      popup_id: popup_id || null,
      email:    email  ? sanitize(email, 254) : null,
      phone:    phone  ? sanitize(phone, 20)  : null,
      name:     name   ? sanitize(name, 100)  : null,
      coupon:   coupon ? sanitize(coupon, 50)  : null,
      prize:    prize  ? sanitize(prize, 100)  : null,
      payload:  sanitizePayload(payload),
    })
    .select()
    .single();
  if (error) return res.status(500).json({ error: 'database_error' });
  return res.status(201).json({ ok: true, lead_id: data.id });
}

export default async function handler(req, res) {
  setSecurityHeaders(res);
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
    return res.status(400).json({ error: 'invalid_request' });
  }
}
