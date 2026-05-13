// /api/public/[type]
// Handles /api/public/event (POST) and /api/public/lead (POST + GET).
// POST = público (loader.js envia leads/events)
// GET  = autenticado (painel admin lista leads)

import { supabase } from '../../lib/supabase.js';
import { setCors, handleOptions, readJson, requireStore, setCorsAuthenticated } from '../../lib/auth.js';
import { setSecurityHeaders } from '../../lib/security.js';
import { isValidEmail, isDisposableEmail, sanitize, isValidStoreId, isValidPhone, sanitizePayload } from '../../lib/validate.js';

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

async function handleLeadPost(req, res, body) {
  const { store_id, popup_id, email, phone, name, coupon, prize, payload } = body;
  if (!store_id) return res.status(400).json({ error: 'missing_store_id' });

  // Validação de email
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: 'invalid_email', message: 'Por favor, use um e-mail válido.' });
  }
  if (email && isDisposableEmail(email)) {
    return res.status(400).json({ error: 'disposable_email', message: 'E-mails temporários não são aceitos.' });
  }
  if (!email && !phone) {
    return res.status(400).json({ error: 'email_or_phone_required' });
  }

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

async function handleLeadGet(req, res) {
  setCorsAuthenticated(res);
  const store = await requireStore(req, res);
  if (!store) return;

  try {
    const { search, popup_id, limit, offset, count, since } = req.query || {};

    if (count === '1') {
      const { count: total, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.store_id);
      if (error) throw error;
      return res.status(200).json({ count: total || 0 });
    }

    let query = supabase
      .from('leads')
      .select('*')
      .eq('store_id', store.store_id)
      .order('created_at', { ascending: false });

    if (popup_id) query = query.eq('popup_id', popup_id);
    if (since) query = query.gte('created_at', since);
    if (search) query = query.or('name.ilike.%' + search + '%,email.ilike.%' + search + '%');

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

export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (handleOptions(req, res)) return;

  const { type } = req.query;

  if (req.method === 'GET' && type === 'lead') {
    return await handleLeadGet(req, res);
  }

  setCors(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  try {
    const body = await readJson(req);
    if (type === 'event') return await handleEvent(req, res, body);
    if (type === 'lead')  return await handleLeadPost(req, res, body);
    return res.status(404).json({ error: 'unknown_type' });
  } catch (e) {
    return res.status(400).json({ error: 'invalid_json', message: e.message });
  }
}
