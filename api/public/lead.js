// /api/public/lead
// Endpoint PÃBLICO para o loader.js enviar leads capturados (email/telefone/cupom).

import { supabase } from '../../lib/supabase.js';
import { setCors, handleOptions, readJson } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  setCors(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  try {
    const body = await readJson(req);
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
  } catch (e) {
    return res.status(400).json({ error: 'invalid_json', message: e.message });
  }
}
