// lib/session.js
// SessÃ£o por cookie assinado (HMAC-SHA256) â leve e stateless.

import crypto from 'crypto';

const COOKIE_NAME = 'ps_session';
const MAX_AGE     = 60 * 60 * 24 * 30; // 30 dias

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error('SESSION_SECRET ausente ou curto demais (min 32 chars).');
  }
  return s;
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlJson(obj) { return b64url(JSON.stringify(obj)); }
function fromB64url(s)   {
  s = s.replace(/-/g,'+').replace(/_/g,'/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64').toString('utf8');
}

export function signSession({ storeId }) {
  const payload = b64urlJson({ sid: storeId, iat: Date.now() });
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest();
  return `${payload}.${b64url(sig)}`;
}

export function verifySession(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sigEnc] = token.split('.');
  const expected = crypto.createHmac('sha256', secret()).update(payload).digest();
  const given    = Buffer.from(sigEnc.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(sigEnc.length/4)*4, '='), 'base64');
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(fromB64url(payload));
    if (!data.sid || !data.iat) return null;
    if (Date.now() - data.iat > MAX_AGE * 1000) return null;
    return { storeId: data.sid };
  } catch { return null; }
}

export function sessionCookie(value, { clear = false } = {}) {
  const attrs = [
    `${COOKIE_NAME}=${clear ? '' : value}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    clear ? 'Max-Age=0' : `Max-Age=${MAX_AGE}`,
  ];
  return attrs.join('; ');
}

export function readSessionFromCookies(cookieHeader) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map(p => p.trim());
  const found = parts.find(p => p.startsWith(`${COOKIE_NAME}=`));
  if (!found) return null;
  const value = decodeURIComponent(found.slice(COOKIE_NAME.length + 1));
  return verifySession(value);
}
