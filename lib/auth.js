// lib/auth.js
// Middleware de autenticação para rotas do painel.
// Verifica cookie de sessão e carrega a loja correspondente.

import { readSessionFromCookies } from './session.js';
import { getStore } from './supabase.js';
import { setSecurityHeaders, setCorsRestricted } from './security.js';

const MAX_BODY_SIZE = 50 * 1024; // 50KB máximo por request body

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

/**
 * CORS público (para loader.js e endpoints públicos).
 */
export function setCors(res, origin = '*') {
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * CORS restrito (para rotas autenticadas do painel).
 */
export function setCorsAuthenticated(res) {
  setCorsRestricted(res);
}

/**
 * Trata preflight OPTIONS com security headers.
 */
export function handleOptions(req, res, restricted = false) {
  setSecurityHeaders(res);
  if (req.method === 'OPTIONS') {
    if (restricted) setCorsAuthenticated(res);
    else setCors(res);
    res.status(204).end();
    return true;
  }
  return false;
}

/**
 * Lê JSON do body com limite de tamanho.
 */
export async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', c => {
      size += c.length;
      if (size > MAX_BODY_SIZE) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      data += c;
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}
