// /api/auth/callback
// Recebe ?code= da Nuvemshop apÃ³s o lojista autorizar.
// 1) Troca code -> access_token
// 2) Busca dados da loja
// 3) Salva/atualiza a loja no Supabase (upsert trata reinstalaÃ§Ã£o)
// 4) Cria cookie de sessÃ£o e redireciona para /app

import { exchangeCodeForToken, getStoreInfo } from '../../lib/nuvemshop.js';
import { upsertStore, getStore } from '../../lib/supabase.js';
import { signSession, sessionCookie } from '../../lib/session.js';

export default async function handler(req, res) {
  try {
    const url  = new URL(req.url, `http://${req.headers.host}`);
    const code = url.searchParams.get('code');

    if (!code) {
      res.status(400).send('Missing code parameter');
      return;
    }

    // 1) Troca code por token
    const tokenData = await exchangeCodeForToken(code);
    const { access_token, token_type, scope, user_id: storeId } = tokenData;
    if (!access_token || !storeId) {
      console.error('[callback] resposta inesperada da Nuvemshop:', tokenData);
      res.status(500).send('Invalid token response');
      return;
    }

    // 2) Busca dados da loja (nome, idioma, paÃ­s etc.)
    let info = {};
    try {
      info = await getStoreInfo(storeId, access_token);
    } catch (e) {
      console.warn('[callback] falha ao buscar /store:', e.message);
    }

    // 3) Upsert -- lida com primeira instalaÃ§Ã£o E reinstalaÃ§Ã£o no mesmo fluxo
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

    // 4) Cria sessÃ£o e redireciona para o painel
    const token  = signSession({ storeId: Number(storeId) });
    res.setHeader('Set-Cookie', sessionCookie(token));
    res.writeHead(302, { Location: '/app' });
    res.end();
  } catch (err) {
    console.error('[callback] erro:', err);
    res.status(500).send('OAuth callback error: ' + err.message);
  }
}
