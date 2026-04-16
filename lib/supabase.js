// lib/supabase.js
// Cliente Supabase usando o service_role key (somente servidor).
// NUNCA importar esse arquivo no frontend.

import { createClient } from '@supabase/supabase-js';

const url  = process.env.SUPABASE_URL;
const key  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('[supabase] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY faltando no .env');
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { headers: { 'x-client-info': 'popup-studio-backend' } },
});

export async function getStore(storeId) {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('store_id', storeId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function upsertStore(row) {
  const { data, error } = await supabase
    .from('stores')
    .upsert(row, { onConflict: 'store_id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function markStoreUninstalled(storeId) {
  const { error } = await supabase
    .from('stores')
    .update({ status: 'uninstalled', uninstalled_at: new Date().toISOString() })
    .eq('store_id', storeId);
  if (error) throw error;
}
