// lib/auth.js
// Middleware de autenticaÃ§Ã£o para rotas do painel.
// Verifica cookie de sessÃ£o e carrega a loja correspondente.

import { readSessionFromCookies } from './session.js';
import { getStore } from './supabase.js';

export async function requireStore(req, res) {
  const session = readSessionFromCookies(req.headers.cookie);
  if (!session) {
    res.status(401).json({ error: 'unauthenticated' });
    return null;
  }
  const store = await getStore(session.storeId);
  if (!store || store.status === 'uninstalled') {
    res.status(401).json({ error: 'store_not_found' });
    return null;
  }
  return store;
}

export function setCors(res, origin = '*') {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function handleOptions(req, res) {
  if (req.method === 'OPTIONS') { setCors(res); res.status(204).end(); return true; }
  return false;
}

export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => (data += c));
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}
