// lib/security.js
// Headers de segurança e utilidades de proteção.

/**
 * Aplica security headers em todas as respostas.
 * Deve ser chamado no início de cada handler.
 */
export function setSecurityHeaders(res) {
  // Previne clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Previne MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Força HTTPS (1 ano)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Previne XSS via referrer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Desabilita APIs perigosas do browser
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Previne cache de dados sensíveis
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
}

/**
 * CSP para páginas do painel (app.html).
 * Mais restritivo que o loader.
 */
export function setCSPPanel(res) {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' https:",
    "connect-src 'self' https://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '));
}

/**
 * CORS restrito para rotas autenticadas.
 * Aceita apenas a URL do próprio app.
 */
export function setCorsRestricted(res) {
  const appUrl = process.env.APP_URL || 'https://popup-studio.vercel.app';
  res.setHeader('Access-Control-Allow-Origin', appUrl);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

/**
 * Sanitiza erro para resposta pública (nunca expor stack traces).
 */
export function safeErrorMessage(err) {
  if (process.env.NODE_ENV === 'development') {
    return err.message || 'Internal error';
  }
  return 'Internal server error';
}
