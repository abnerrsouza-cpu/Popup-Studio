// lib/rateLimit.js
// Rate limiter em memória para serverless (Vercel).

const store = new Map();
const WINDOW_MS = 60 * 1000;
const CLEANUP_INTERVAL = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.start > WINDOW_MS * 2) store.delete(key);
  }
}, CLEANUP_INTERVAL);

export function rateLimit(req, res, maxRequests = 30) {
  const ip = getClientIP(req);
  const now = Date.now();
  let entry = store.get(ip);
  if (!entry || now - entry.start > WINDOW_MS) {
    entry = { count: 0, start: now };
    store.set(ip, entry);
  }
  entry.count++;
  const remaining = Math.max(0, maxRequests - entry.count);
  const resetAt = Math.ceil((entry.start + WINDOW_MS) / 1000);
  res.setHeader("X-RateLimit-Limit", String(maxRequests));
  res.setHeader("X-RateLimit-Remaining", String(remaining));
  res.setHeader("X-RateLimit-Reset", String(resetAt));
  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.start + WINDOW_MS - now) / 1000);
    res.setHeader("Retry-After", String(retryAfter));
    res.status(429).json({ error: "too_many_requests", message: "Rate limit exceeded. Try again in " + retryAfter + "s." });
    return true;
  }
  return false;
}

export function rateLimitStrict(req, res) {
  return rateLimit(req, res, 10);
}

function getClientIP(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.headers["x-real-ip"] || req.socket?.remoteAddress || "unknown";
}
