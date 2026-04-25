// /api/auth/callback
// Recebe ?code= da Nuvemshop após o lojista autorizar.
// SEGURANÇA: rate limit, erro genérico, security headers.

import { exchangeCodeForToken, getStoreInfo } from '../../lib/nuvemshop.js';
import { upsertStore, getStore } from '../../lib/supabase.js';
import { signSession, sessionCookie } from '../../lib/session.js';
import { rateLimitStrict } from '../../lib/rateLimit.js';
import { setSecurityHeaders, safeErrorMessage } from '../../lib/security.js';

export default async function handler(req, res) {
  setSecurityHeaders(res);

  // Rate limit estrito: 10 tentativas/min
  if (rateLimitStrict(req, res)) return;

  try {
    const url  = new URL(req.url, `http://${req.headers.host}`);
    const code = url.searchParams.get('code');

    if (!code || typeof code !== 'string' || code.length > 500) {
      res.status(400).send('Invalid request');
      return;
    }

    // 1) Troca code por token
    const tokenData = await exchangeCodeForToken(code);
    const { access_token, token_type, scope, user_id: storeId } = tokenData;
    if (!access_token || !storeId) {
      console.error('[callback] resposta inesperada da Nuvemshop');
      res.status(500).send('Authentication failed');
      return;
    }

    // 2) Busca dados da loja
    let info = {};
    try {
      info = await getStoreInfo(storeId, access_token);
    } catch (e) {
      console.warn('[callback] falha ao buscar /store:', e.message);
    }

    // 3) Upsert
    const existing = await getStore(storeId);
    const row = {
      store_id:           Number(storeId),
      access_token,
      token_type:         token_type || 'bearer',
      scope:              scope || null,
      status:             'active',
      shop_name:          info?.name?.pt || info?.name?.['pt-br'] || info?.name?.es || (typeof info?.name === 'string' ? info.name : null),
      shop_main_language: info?.main_language || null,
      shop_country:       info?.country || null,
      shop_email:         info?.email || null,
      shop_url:           info?.url || info?.original_domain || null,
      installed_at:       existing?.installed_at || new Date().toISOString(),
      reinstalled_at:     existing ? new Date().toISOString() : null,
      uninstalled_at:     null,
    };

    await upsertStore(row);

    // 4) Cria sessão e redireciona
    const token  = signSession({ storeId: Number(storeId) });
    res.setHeader('Set-Cookie', sessionCookie(token));
    res.writeHead(302, { Location: '/app' });
    res.end();
  } catch (err) {
    console.error('[callback] erro:', err);
    // SEGURANÇA: nunca expor err.message ao cliente
    res.status(500).send('Authentication error. Please try again.');
  }
}
