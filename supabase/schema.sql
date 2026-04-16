-- =========================================================
-- PopUp Studio - Schema Supabase (Postgres)
-- Rode este SQL inteiro no SQL Editor do Supabase apÃ³s criar o projeto.
-- =========================================================

-- ExtensÃµes Ãºteis
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- =========================================================
-- STORES - uma linha por loja Nuvemshop instalada
-- =========================================================
create table if not exists public.stores (
  store_id           bigint primary key,                -- user_id da Nuvemshop (mesmo que store_id)
  access_token       text not null,
  token_type         text default 'bearer',
  scope              text,
  installed_at       timestamptz not null default now(),
  reinstalled_at     timestamptz,
  uninstalled_at     timestamptz,
  status             text not null default 'active',    -- active | uninstalled | suspended
  shop_name          text,
  shop_main_language text,
  shop_country       text,
  shop_email         text,
  shop_url           text,
  plan_name          text default 'free',               -- free | starter | pro
  meta               jsonb not null default '{}'::jsonb,
  updated_at         timestamptz not null default now()
);

create index if not exists stores_status_idx on public.stores (status);

-- =========================================================
-- POPUPS - cada pop-up configurado pelo lojista
-- =========================================================
create table if not exists public.popups (
  id           uuid primary key default uuid_generate_v4(),
  store_id     bigint not null references public.stores(store_id) on delete cascade,
  name         text not null,
  game_type    text not null,                           -- slot-machine, roleta, raspadinha, etc.
  config       jsonb not null default '{}'::jsonb,      -- cores, textos, prÃªmios, regras, etc.
  status       text not null default 'draft',           -- draft | published | archived
  script_id    bigint,                                  -- id retornado pela API de Scripts da Nuvemshop
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists popups_store_id_idx  on public.popups (store_id);
create index if not exists popups_status_idx    on public.popups (status);

-- =========================================================
-- EVENTS - impressÃµes, plays, leads (para analytics)
-- =========================================================
create table if not exists public.events (
  id         bigserial primary key,
  store_id   bigint not null,
  popup_id   uuid,
  event_type text not null,                             -- impression | play | win | lead | coupon_used
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_store_id_idx    on public.events (store_id);
create index if not exists events_popup_id_idx    on public.events (popup_id);
create index if not exists events_created_at_idx  on public.events (created_at desc);
create index if not exists events_type_idx        on public.events (event_type);

-- =========================================================
-- LEADS - e-mails/telefones capturados
-- =========================================================
create table if not exists public.leads (
  id         bigserial primary key,
  store_id   bigint not null,
  popup_id   uuid,
  email      text,
  phone      text,
  name       text,
  coupon     text,
  prize      text,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists leads_store_id_idx   on public.leads (store_id);
create index if not exists leads_email_idx      on public.leads (email);
create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- =========================================================
-- AUTO-UPDATE updated_at
-- =========================================================
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists stores_touch on public.stores;
create trigger stores_touch before update on public.stores
for each row execute function public.touch_updated_at();

drop trigger if exists popups_touch on public.popups;
create trigger popups_touch before update on public.popups
for each row execute function public.touch_updated_at();

-- =========================================================
-- RLS - Row Level Security
-- (sÃ³ o service_role do backend acessa; o frontend nÃ£o bate direto)
-- =========================================================
alter table public.stores  enable row level security;
alter table public.popups  enable row level security;
alter table public.events  enable row level security;
alter table public.leads   enable row level security;

-- Nenhuma policy pÃºblica = apenas service_role tem acesso.
