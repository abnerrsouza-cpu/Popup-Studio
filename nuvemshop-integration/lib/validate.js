// lib/validate.js
// Validação e sanitização de inputs para endpoints públicos.

// Regex mais rigorosa: user@domain.tld (TLD mínimo 2 chars, sem espaços)
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^[\d\s()+-]{7,20}$/;
const MAX_STRING = 500;
const MAX_JSON_SIZE = 10000; // 10KB max para payloads JSON

// Domínios de e-mail descartáveis/temporários mais comuns
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','guerrillamail.net','tempmail.com','throwaway.email',
  'temp-mail.org','fakeinbox.com','sharklasers.com','guerrillamailblock.com','grr.la',
  'dispostable.com','yopmail.com','yopmail.fr','cool.fr.nf','jetable.fr.nf',
  'nospam.ze.tc','nomail.xl.cx','mega.zik.dj','speed.1s.fr','courriel.fr.nf',
  'moncourrier.fr.nf','monemail.fr.nf','monmail.fr.nf','trashmail.com','trashmail.me',
  'trashmail.net','trashymail.com','trashymail.net','10minutemail.com','10minutemail.net',
  'tempail.com','tempr.email','discard.email','discardmail.com','discardmail.de',
  'emailondeck.com','33mail.com','maildrop.cc','mailnesia.com','mailcatch.com',
  'mailsac.com','mohmal.com','getnada.com','mailnull.com','spamgourmet.com',
  'mytemp.email','mt2015.com','thankyou2010.com','trash-mail.com','binkmail.com',
  'bobmail.info','chammy.info','devnullmail.com','letthemeatspam.com','mailinater.com',
  'mailforspam.com','safetymail.info','spamfree24.org','filzmail.com','incognitomail.org',
  'mailexpire.com','mailzilla.com','opensearch.ai','tempinbox.com','tempmailaddress.com',
  'emailfake.com','crazymailing.com','armyspy.com','dayrep.com','einrot.com',
  'fleckens.hu','gustr.com','jourrapide.com','rhyta.com','superrito.com','teleworm.us',
  'fidamul.com','fidamul','aosod.com'
]);

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
 * Valida formato de email de forma rigorosa.
 * Rejeita: formatos inválidos, domínios descartáveis, TLDs inexistentes.
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 254) return false;
  if (!EMAIL_REGEX.test(trimmed)) return false;

  // Extrair domínio
  const domain = trimmed.split('@')[1];
  if (!domain) return false;

  // Bloquear domínios descartáveis
  if (DISPOSABLE_DOMAINS.has(domain)) return false;

  // Bloquear domínios sem ponto (ex: "user@localhost")
  if (!domain.includes('.')) return false;

  // Bloquear TLDs obviamente falsos (1 char)
  const tld = domain.split('.').pop();
  if (!tld || tld.length < 2) return false;

  return true;
}

/**
 * Verifica se o domínio do email é descartável.
 */
export function isDisposableEmail(email) {
  if (!email || typeof email !== 'string') return true;
  const domain = email.trim().toLowerCase().split('@')[1];
  return !domain || DISPOSABLE_DOMAINS.has(domain);
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
