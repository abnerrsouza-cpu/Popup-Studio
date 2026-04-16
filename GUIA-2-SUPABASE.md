# Guia 2/3 â Setup do Supabase (banco de dados)

O Supabase vai guardar: lojas instaladas, pop-ups, leads capturados e eventos de analytics.

## Passo 1 â Criar projeto

1. Acesse **https://supabase.com** â **Start your project**.
2. Login com GitHub (recomendado).
3. Clique em **New project**.
4. Preencha:
   - **Name:** `popup-studio`
   - **Database password:** gere uma senha forte (cole no 1Password/Bitwarden).
   - **Region:** `South America (SÃ£o Paulo)` â latÃªncia baixa para lojas BR.
   - **Plan:** Free (suficiente pro comeÃ§o; atÃ© 500MB e 50k usuÃ¡rios auth).
5. Clique em **Create new project** e espere ~2 minutos enquanto provisiona.

## Passo 2 â Rodar o schema SQL

1. No menu lateral do Supabase, vÃ¡ em **SQL Editor**.
2. Clique em **New query**.
3. Abra o arquivo `supabase/schema.sql` deste projeto e **copie TODO o conteÃºdo**.
4. Cole no editor do Supabase e clique **Run** (ou `Ctrl+Enter`).
5. VocÃª deve ver a mensagem **Success. No rows returned**.

Isso cria as tabelas: `stores`, `popups`, `events`, `leads`, triggers de `updated_at`,
Ã­ndices e RLS (Row Level Security).

## Passo 3 â Pegar as credenciais

VÃ¡ em **Settings â API** e copie:

| Nome no Supabase | Vai para `.env` |
|---|---|
| **Project URL** | `SUPABASE_URL` |
| **service_role secret** (â ï¸ nÃ£o Ã© a anon) | `SUPABASE_SERVICE_ROLE_KEY` |

> â ï¸ **IMPORTANTE:** use o `service_role` key, **nÃ£o** o `anon`. O `service_role` ignora RLS
> porque o backend confia nele. Nunca exponha essa chave no frontend.

## Passo 4 â Validar

Volte ao **SQL Editor** e rode:

```sql
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Deve retornar: `events`, `leads`, `popups`, `stores`.

## Dicas

- **Backups:** no plano Free o Supabase faz backup diÃ¡rio automÃ¡tico (retÃ©m 7 dias).
- **Logs:** em **Logs â Database** vocÃª vÃ  todas as queries em tempo real (Ãºtil pra debug).
- **Migrations futuras:** sempre rode novo SQL no **SQL Editor** e mantenha os arquivos
  em `supabase/migrations/` versionados no Git.

---

**PrÃ³ximo guia:** [`GUIA-3-DEPLOY.md`](./GUIA-3-DEPLOY.md)
