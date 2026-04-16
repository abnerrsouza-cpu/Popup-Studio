# Guia 3/3 â Deploy na Vercel + integraÃ§Ã£o final

PrÃ©-requisitos: jÃ¡ concluiu os guias 1 e 2.
VocÃª deve ter em mÃ£o c `client_id`, `client_secret`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## Passo 1 â Copiar os arquivos para o repositÃ³rio GitHub

O projeto estÃ¡ organizado em `/saas/nuvemshop-integration/` no workspace.
Todo esse conteÃºdo precisa ir para a raiz do repositÃ³rio `abnerrsouza-cpu/Popup-Studio`
(onde jÃ¡ estÃ¡ o `index.html` atual).

Estrutura final esperada no repo:

```
Popup-Studio/
âââ index.html                 # SPA atual (landing + 13 jogos demo)
âââ app.html                   # (novo) painel logado â TODO: adicionar
âââ loader.js                  # (novo) script injetado nas lojas
âââ api/
â   âââ auth/
â   â   âââ install.js
â   â   âââ callback.js
â   â   âââ logout.js
â   â   âââ uninstall.js
â   âââ popups/
â   â   âââ index.js
â   â   âââ [id].js
â   â   âââ publish.js
â   â   âââ unpublish.js
â   âââ public/
â   â   âââ config.js
â   â   âââ lead.js
â   â   âââ event.js
â   âââ me.js
âââ lib/
â   âââ supabase.js
â   âââ nuvemshop.js
â   âââ session.js
â   âââ auth.js
âââ supabase/
â   âââ schema.sql
âââ package.json
âââ vercel.json
âââ .gitignore
```

## Passo 2 â Configurar env vars na Vercel

1. Acesse **https://vercel.com/abnerrsouza-cpus-projects/popup-studio/settings/environment-variables**
2. Para cada variÃ¡vel do `.env.example`, clique **Add New** e coloque:

| Nome | Valor | Environments |
|---|---|---|
| `NUVEMSHOP_CLIENT_ID` | (do passo 5 do Guia 1) | Production, Preview, Development |
| `NUVEMSHOP_CLIENT_SECRET` | (do passo 5 do Guia 1) | Production, Preview, Development |
| `SUPABASE_URL` | (do passo 3 do Guia 2) | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | (do passo 3 do Guia 2) | Production, Preview, Development |
| `APP_URL` | `https://popup-studio.vercel.app` | Production, Preview, Development |
| `APP_NAME` | `PopUp Studio` | todas |
| `APP_EMAIL` | seu e-mail de contato | todas |
| `SESSION_SECRET` | string aleatÃ³ria 64 chars* | todas |

\* gere com: `openssl rand -hex 32` ou em https://generate-secret.vercel.app/32

## Passo 3 â Instalar dependÃªncia

Como estamos usando `@supabase/supabase-js`, precisa rodar **npm install** uma vez
para gerar o `package-lock.json`. A Vercel vai detectar o `package.json` e instalar
automaticamente no prÃ³ximo deploy.

Se quiser testar localmente antes:
```bash
npm install
vercel dev
```

## Passo 4 â Deploy

Basta commitar os arquivos novos no branch `main`. A Vercel auto-deploya.

```bash
git add .
git commit -m "feat: Nuvemshop OAuth + API + loader backend"
git push origin main
```

## Passo 5 â Teste end-to-end

1. **Instalar numa loja teste:**
   - Na sua loja de teste Nuvemshop, acesse:
     `https://www.tiendanube.com/apps/{SEU_CLIENT_ID}/authorize`
   - Clique **Aceitar e instalar**.
   - Deve redirecionar para `/api/auth/callback?code=...` e depois para `/app`.

2. **Verificar DB:**
   - No Supabase â **Table Editor** â `stores`.
   - Deve ter uma linha com `access_token` preenchido e `status='active'`.

3. **Criar um pop-up pelo painel** (via API enquanto o `app.html` nÃ£o existe):
   ```bash
   curl -X POST https://popup-studio.vercel.app/api/popups \
     -H "Content-Type: application/json" \
     -H "Cookie: ps_session=SEU_COOKIE" \
     -d '{"name":"Teste","game_type":"slot-machine","config":{"title":"Ganhe 10% OFF","prize":"10% OFF","coupon":"BEMVINDO10"}}'
   ```

4. **Publicar o pop-up:**
   ```bash
   curl -X POST https://popup-studio.vercel.app/api/popups/publish \
     -H "Content-Type: application/json" -H "Cookie: ps_session=SEU_COOKIE" \
     -d '{"id":"UUID_DO_POPUP"}'
   ```

5. **Abrir a vitrine da loja teste** â ` pop-up deve aparecer apÃ³s 1,5s.

6. **Verificar Scripts injetados:**
   ```bash
   curl https://api.nuvemshop.com.br/v1/{STORE_ID}/scripts \
     -H "Authentication: bearer SEU_TOKEN" \
     -H "User-Agent: PopUp Studio (contato@popupstudio.app)"
   ```
   Deve listar nosso `loader.js`.

## Passo 6 â Submeter Ã  homologaÃ§Ã£o

Quando o fluxo estiver 100% testado:

1. No painel de Partners Nuvemshop â seu app â **Enviar para homologaÃ§Ã£o**.
2. Preencha: screenshots, vÃ­deo de demo, polÃ­tica de privacidade, termos de uso.
3. Aguardam ~7 dias Ãºteis. Se aprovado, o app aparece na App Store pÃºblica.

---

## Arquitetura do fluxo completo

```
âââââââââââââââââââ         ââââââââââââââââââââââââ         ââââââââââââââââââââ
â   App Store      â  code   â  popup-studio.       â  token  â   Nuvemshop API  â
â   Nuvemshop     âââââââââââ  vercel.app/         âââââââââ>â                  â
â                 â        â  api/auth/callback   â<âââââââââ¤ (tiendanube.com) â
âââââââââââââââââââ         ââââââââ¬ââââââââââââââââ         ââââââââââââââââââââ
                                   â salva token
                                   â¼
                            ââââââââââââââââ
                            â   Supabase   â
                            â  (Postgres)  â
                            ââââââââ¬ââââââââ
                                   â
                                   â  session cookie + redirect
                                   â¼
                            âââââââââââââââââââ
                            â   /app          â  <- lojista gerencia pop-ups
                            â   (painel)      â
                            ââââââââ¬âââââââââââ
                                   â publica popup
                                   â¼
                            âââââââââââââââââââ
                            â POST /v1/.../  â  cria script na loja
                            â   scripts      â
                            ââââââââââââââââââ
                                   â
                                   â¼
                            loja do cliente carrega
                            <script src="popup-studio.vercel.app/loader.js?store_id=X">
                                   â
                                   â¼
                            loader.js busca /api/public/config
                            exibe pop-up, captura lead â /api/public/lead
```
