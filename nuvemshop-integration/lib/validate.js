// lib/validate.js
// Validação e sanitização de inputs.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s()+-]{7,20}$/;
const MAX_STRING = 500;
const MAX_JSON = 10000;

export function sanitize(str, maxLen = MAX_STRING) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').replace(/[<>'`;]/g, '').trim().slice(0, maxLen);
}

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim()) && email.length <= 254;
}

export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return PHONE_REGEX.test(phone.trim());
}

export function sanitizePayload(payload) {
  if (!payload || typeof payload !== 'object') return {};
  if (JSON.stringify(payload).length > MAX_JSON) return {};
  return payload;
}

export function isValidStoreId(id) {
  var num = Number(id);
  return Number.isInteger(num) && num > 0 && num < Number.MAX_SAFE_INTEGER;
}

var ALLOWED_EVENTS = new Set(['impression','play','win','close','coupon_used']);
export function isValidEventType(type) {
  return typeof type === 'string' && ALLOWED_EVENTS.has(type);
}

var ALLOWED_GAMES = new Set(['spin_wheel','slot_machine','skate_grind','scratch_card','quiz','memory_game','gift_box','balloon_pop']);
export function isValidGameType(type) {
  return typeof type === 'string' && ALLOWED_GAMES.has(type);
}
