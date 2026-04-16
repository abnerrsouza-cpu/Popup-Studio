# PopUp Studio â Backend Nuvemshop (App Externo)

IntegraÃ§Ã£o OAuth 2.0 + API Nuvemshop + Supabase + loader pÃºblico,
pronta para ser submetida Ã  homologaÃ§Ã£o da App Store da Nuvemshop.

## O que estÃ¡ pronto

- â **OAuth 2.0** completo: `/api/auth/install` â `/api/auth/callback` â sessÃ£o cookie
- â **Troca de code por access_token** via `https://www.tiendanube.com/apps/authorize/token`
- â **Upsert de loja** no Supabase (primeira instalaÃ§Ã£o E reinstalaÃ§Ã£o no mesmo fluxo)
- â **Webhook de desinstalaÃ§Ã£o** em `/api/auth/uninstall`
- â **CRUD de pop-ups** (`/api/popups`, `/api/popups/[id]`)
- â **Publicar / despublicar** via API de Scripts (`POST`/`DELETE` em `/v1/{store_id}/scripts`)
- â **Headers corretos**: `Authentication: bearer TOKEN` + `User-Agent: App (email)`
- â **Endpoint pÃºblico** `/api/public/config?store_id=X` para o loader buscar config
- â **loader.js** pÃºblico: injeta pop-up na vitrine, captura leads, envia eventos
- â **Captura de leads** (`/api/public/lead`) e **analytics** (`/api/public/event`)
- â **Row Level Security** no Supabase (sÃ³ service_role acessa)
- â **AutenticaÃ§Ã£o nas rotas do painel** via `requireStore()` â retorna 401 sem sessÃ£o vÃ¡lida
- â **client_secret sÃ³ no backend** (nunca no frontend)

## O que ainda precisa ser feito (apÃ³s o OAuth estar rodando)

- [ ] **app.html** â painel do lojista integrado Ã s APIs (hoje o `popup-studio-v2.html` Ã© sÃ³ demo visual)
  - Lista de pop-ups com filtros
  - Criador de pop-up (reusar os 13 jogos jÃ¡ prontos)
  - BotÃ£o publicar/despublicar com loading/sucesso/erro
  - Dashboard de analytics lendo `events` e `leads`
- [ ] **SegmentaÃ§Ã£o** de pop-ups por pÃ¡gina (home, produto, carrinho) â adicionar `trigger_rules` no config
- [ ] **A/B testing** â duplicar popup e split 50/50
- [ ] **Templates prontos** â seed de configs comuns (10% OFF, frete grÃ¡tis, etc.)
- [ ] **i18n** â suportar PT-BR / ES / EN no painel

## Como comeÃ§ar

Leia os guias em ordem:

1. **[GUIA-1-PARTNER-NUVEMSHOP.md](./GUIA-1-PARTNER-NUVEMSHOP.md)** â criar conta de Partner e app
2. **[GUIA-2-SUPABASE.md](./GUIA-2-SUPABASE.md)** â setup do banco
3. **[GUIA-3-DEPLOY.md](./GUIA-3-DEPLOY.md)** â copiar arquivos para o repo, configurar env vars, deploy, testar

## Estrutura do projeto

```
api/
  auth/        OAuth + uninstall webhook
  popups/      CRUD + publish/unpublish
  public/      endpoints chamados pelo loader.js (sem auth de sessÃ£o)
  me.js        dados da loja logada

lib/
  supabase.js  cliente Supabase (service_role)
  nuvemshop.js client HTTP para API da Nuvemshop
  session.js   JWT-like cookie assinado (HMAC-SHA256)
  auth.js      middleware requireStore() e helpers

public/
  loader.js    script injetado nas lojas clientes

supabase/
  schema.sql   schema completo (stores, popups, events, leads)
```

## Checklist de homologaÃ§Ã£o Nuvemshop

Antes de submeter:

- [x] OAuth flow funciona (install â callback â redirect app)
- [x] Token trocado e salvo corretamente
- [x] ReinstalaÃ§Ã£o tratada (upsert)
- [x] Scripts injetados com `Authentication: bearer` + `User-Agent`
- [x] DesinstalaÃ§Ã£o limpa scripts (via webhook + via unpublish)
- [x] Nenhum secret no frontend
- [x] Painel exige autenticaÃ§Ã£o
- [ ] PolÃ­tica de privacidade pÃºblica em `/privacy`
- [ ] Termos de uso pÃºblicos em `/terms`
- [ ] Screenshots + vÃ­deo demo do painel
- [ ] DescriÃ§Ã£o do app em PT-BR, ES, EN
- [ ] Logo 512X512 + Ã­cone 128X128
