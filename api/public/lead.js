// /api/public/lead
// Endpoint PÚBLICO para o loader.js enviar leads capturados.
// SEGURANÇA: rate limit, validação de input, sanitização.

import { supabase } from '../../lib/supabase.js';
import { setCors, handleOptions, readJson } from '../../lib/auth.js';
import { rateLimit } from '../../lib/rateLimit.js';
import { setSecurityHeaders } from '../../lib/security.js';
import {
  sanitize, isValidEmail, isValidPhone,
  isValidStoreId, sanitizePayload,
} from '../../lib/validate.js';

export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (handleOptions(req, res)) return;
  setCors(res);

  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  // Rate limit: 20 leads/min por IP
  if (rateLimit(req, res, 20)) return;

  try {
    const body = await readJson(req);
    const { store_id, popup_id, email, phone, name, coupon, prize, payload } = body;

    // Validação
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
  } catch (e) {
    return res.status(400).json({ error: 'invalid_request' });
  }
}
