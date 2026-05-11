// lib/nuvemshop.js
// Cliente HTTP para a API da Nuvemshop (Tiendanube).
// Docs: https://tiendanube.github.io/api-documentation/

const TOKEN_URL = 'https://www.tiendanube.com/apps/authorize/token';
const API_BASE  = 'https://api.nuvemshop.com.br/v1';

// User-Agent obrigatório: nome do app + email de contato (exigência Nuvemshop).
function userAgent() {
  const name  = process.env.APP_NAME    || 'PhopUp Studio';
  const email = process.env.APP_EMAIL   || 'contato@popupstudio.app';
  return `${name} (${email})`;
}

// ---------- OAuth: troca code por access_token ----------
export async function exchangeCodeForToken(code) {
  const body = {
    client_id:     process.env.NUVEMSHOP_CLIENT_ID,
    client_secret: process.env.NUVEMSHOP_CLIENT_SECRET,
    grant_type:    'authorization_code',
    code,
  };

  const res = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent':   userAgent(),
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json.error_description || json.error || `HTTP ${res.status}`;
    throw new Error(`Nuvemshop token exchange failed: ${msg}`);
  }
  // Retorna: { access_token, token_type, scope, user_id }
  return json;
}

// ---------- Request genérico autenticado ----------
async function apiRequest(storeId, accessToken, pathname, { method = 'GET', body } = {}) {
  const url = `${API_BASE}/${storeId}${pathname}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type':    'application/json; charset=utf-8',
      'Authentication':  `bearer ${accessToken}`,   // <- nome correto conforme docs
      'User-Agent':      userAgent(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const json = text ? safeJson(text) : null;

  if (!res.ok) {
    const msg = (json && (json.message || json.description)) || text || `HTTP ${res.status}`;
    const err = new Error(`Nuvemshop API error ${res.status}: ${msg}`);
    err.status = res.status;
    err.body   = json;
    throw err;
  }
  return json;
}

function safeJson(str) { try { return JSON.parse(str); } catch { return null; } }

// ---------- Loja: dados da conta ----------
export function getStoreInfo(storeId, accessToken) {
  return apiRequest(storeId, accessToken, '/store');
}

// ---------- Scripts: listar / criar / deletar ----------
export function listScripts(storeId, accessToken) {
  return apiRequest(storeId, accessToken, '/scripts');
}

export function createScript(storeId, accessToken, { src, event = 'onfirstinteraction', where = 'store' }) {
  const body = { src, event, where };
  return apiRequest(storeId, accessToken, '/scripts', {
    method: 'POST',
    body,
  });
}

export function deleteScript(storeId, accessToken, scriptId) {
  return apiRequest(storeId, accessToken, `/scripts/${scriptId}`, { method: 'DELETE' });
}

// ---------- Webhooks: registrar hook de desinstalação ----------
export function createWebhook(storeId, accessToken, { event, url }) {
  return apiRequest(storeId, accessToken, '/webhooks', {
    method: 'POST',
    body:   { event, url },
  });
}
