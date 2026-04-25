// lib/validate.js
// Validação e sanitização de inputs para endpoints públicos.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[\d\s()+-]{7,20}$/;
const MAX_STRING = 500;
const MAX_JSON_SIZE = 10000; // 10KB max para payloads JSON

/**
 * Sanitiza uma string: remove tags HTML, trim, limita tamanho.
 */
export function sanitize(str, maxLen = MAX_STRING) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '')       // remove tags HTML
    .replace(/[<>"'`;]/g, '')      // remove chars perigosos
    .trim()
    .slice(0, maxLen);
}

/**
 * Valida formato de email.
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim()) && email.length <= 254;
}

/**
 * Valida formato de telefone.
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  return PHONE_REGEX.test(phone.trim());
}

/**
 * Valida e limita um payload JSONB (previne payloads enormes).
 */
export function sanitizePayload(payload) {
  if (!payload || typeof payload !== 'object') return {};
  const str = JSON.stringify(payload);
  if (str.length > MAX_JSON_SIZE) return {};
  return payload;
}

/**
 * Valida store_id (deve ser número positivo).
 */
export function isValidStoreId(id) {
  const num = Number(id);
  return Number.isInteger(num) && num > 0 && num < Number.MAX_SAFE_INTEGER;
}

/**
 * Valida event_type contra lista de permitidos.
 */
const ALLOWED_EVENTS = new Set(['impression', 'play', 'win', 'close', 'coupon_used']);
export function isValidEventType(type) {
  return typeof type === 'string' && ALLOWED_EVENTS.has(type);
}

/**
 * Valida game_type.
 */
const ALLOWED_GAMES = new Set(['spin_wheel', 'slot_machine', 'skate_grind', 'scratch_card', 'quiz', 'memory_game', 'gift_box', 'balloon_pop']);
export function isValidGameType(type) {
  return typeof type === 'string' && ALLOWED_GAMES.has(type);
}
