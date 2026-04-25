// lib/rateLimit.js
// Rate limiter em memória para serverless (Vercel).
// Usa Map global que persiste entre invocações na mesma instância.
// Para produção com alto tráfego, migrar para Upstash Redis.

const store = new Map();
const WINDOW_MS = 60 * 1000; // 1 minuto
const CLEANUP_INTERVAL = 5 * 60 * 1000; // limpa entradas antigas a cada 5 min

// Limpa entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.start > WINDOW_MS * 2) store.delete(key);
  }
}, CLEANUP_INTERVAL);

/**
 * Verifica rate limit por IP.
 * @param {object} req - request object
 * @param {object} res - response object
 * @param {number} maxRequests - máximo de requests por janela (default: 30)
 * @returns {boolean} true se bloqueado (já respondeu 429), false se ok
 */
export function rateLimit(req, res, maxRequests = 30) {
  const ip = getClientIP(req);
  const now = Date.now();
  const key = ip;

  let entry = store.get(key);
  if (!entry || now - entry.start > WINDOW_MS) {
    entry = { count: 0, start: now };
    store.set(key, entry);
  }

  entry.count++;

  // Headers informativos
  const remaining = Math.max(0, maxRequests - entry.count);
  const resetAt = Math.ceil((entry.start + WINDOW_MS) / 1000);
  res.setHeader('X-RateLimit-Limit', String(maxRequests));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(resetAt));

  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.start + WINDOW_MS - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({
      error: 'too_many_requests',
      message: \`Rate limit exceeded. Try again in \${retryAfter}s.\`,
    });
    return true; // bloqueado
  }

  return false; // ok
}

/**
 * Rate limit mais restrito para endpoints sensíveis (auth, webhook).
 */
export function rateLimitStrict(req, res) {
  return rateLimit(req, res, 10); // 10 req/min
}

/**
 * Extrai IP do cliente (Vercel/Cloudflare headers).
 */
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}
