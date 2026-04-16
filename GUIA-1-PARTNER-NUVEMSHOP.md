# Guia 1/3 â Cadastro como Partner Nuvemshop e criaÃ§Ã£o do app

Este Ã© o prÃ©-requisito obrigatÃ³rio. Sem o `client_id` e `client_secret` nÃ£o hÃ¡ OAuth.

## Passo 1 â Criar conta de Partner

1. Acesse **https://partners.nuvemshop.com.br**
2. Clique em **Cadastrar** (ou **Registrar-se**).
3. Preencha: nome, email, empresa, paÃ­s (Brasil), telefone.
4. Confirme o e-mail recebido.

## Passo 2 â Criar o aplicativo

1. No painel de Partners, vÃ¡ em **Aplicativos â Criar novo aplicativo**.
2. Preencha:
   - **Nome do app:** `PopUp Studio`
   - **DescriÃ§Ã£o curta:** `Pop-ups gamificados para capturar leads e aumentar conversÃ£o`
   - **Categoria:** Marketing / ConversÃ£o / Pop-ups
   - **Tipo:** Aplicativo externo (standalone)
   - **Idiomas:** PortuguÃªs (BR), Espanhol, InglÃªs

## Passo 3 â Configurar URLs (CRÃTICO)

Na aba **URLs de redirecionamento** / **OAuth**, configure exatamente:

| Campo | Valor |
|---|---|
| **Redirect URI (Callback)** | `https://popup-studio.vercel.app/api/auth/callback` |
| **App URL (Home do app)** | `https://popup-studio.vercel.app/app` |
| **Webhook Uninstall** | `https://popup-studio.vercel.app/api/auth/uninstall` |

> â ï¸ Essas URLs precisam bater EXATAMENTE com o que estÃ¡ no cÃ³digo. Qualquer divergÃªncia quebra o OAuth.

## Passo 4 â Definir Scopes (permissÃµes)

Marque apenas o necessÃ¡rio para o app:

- â `read_store_information` â para ler nome/URL da loja
- â `read_scripts` â listar scripts jÃ¡ injetados
- â `write_scripts` â injetar e remover nosso loader.js
- â `read_content` â ler pÃ¡ginas (se quiser segmentar pop-up por pÃ¡gina)

> PeÃ§a sÃ³ o mÃ­nimo. PermissÃµes a mais atrapalham na homologaÃ§Ã£o.

## Passo 5 â Obter credenciais

Na aba **Credenciais** do app vocÃª vai ver:

- **App ID / Client ID** â copie, serÃ¡ o `NUVEMSHOP_CLIENT_ID`
- **Client Secret** â copie, serÃ¡ o `NUVEMSHOP_CLIENT_SECRET`

Guarde essas duas strings. Elas vÃ£o no `.env` no passo 3 do guia de deploy.

## Passo 6 â Ativar modo desenvolvimento

No painel do app, deixe em **Modo de desenvolvimento**. Isso permite instalar
sÃ³ em lojas de teste suas enquanto construÃ­mos. Quando estiver tudo pronto,
submetemos Ã  homologaÃ§Ã£o para ativar publicamente.

## Passo 7 â Criar uma loja de teste

1. Ainda em Partners, vÃ¡ em **Lojas de teste**.
2. Clique em **Criar loja de teste** (Ã© grÃ¡tis e ilimitado para desenvolvedores).
3. Anote a URL dela (ex.: `https://suateste.lojavirtualnuvem.com.br`).
4. Use essa loja para instalar o app durante o desenvolvimento.

---

**PrÃ³ximo guia:** [`GUIA-2-SUPABASE.md`](./GUIA-2-SUPABASE.md)
