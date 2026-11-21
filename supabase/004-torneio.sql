-- Migração 004 · Torneio de FIFA (participantes, sorteio e resultados)
-- Rodar uma vez no SQL Editor do Supabase. É só acréscimo: não mexe nas tabelas das ideias.

create table if not exists public.cb2_torneio (
  id integer primary key default 1 check (id = 1),     -- uma linha só
  dados jsonb not null default '{}'::jsonb,            -- {participantes:[], sorteio:{J1:..}, sorteadoEm, resultados:{}}
  atualizado timestamptz not null default now()
);
alter table public.cb2_torneio enable row level security;   -- sem políticas: o público não lê nem escreve direto
insert into public.cb2_torneio (id) values (1) on conflict (id) do nothing;

create or replace function public.cb2_torneio_ler()
returns jsonb language sql stable set search_path = public as $$
  select coalesce((select dados from cb2_torneio where id = 1), '{}'::jsonb);
$$;

create or replace function public.cb2_torneio_salvar(p_dados jsonb)
returns void language sql set search_path = public as $$
  insert into cb2_torneio (id, dados, atualizado) values (1, p_dados, now())
  on conflict (id) do update set dados = excluded.dados, atualizado = now();
$$;

revoke all on table public.cb2_torneio from anon, authenticated;
revoke all on function public.cb2_torneio_ler()            from public, anon, authenticated;
revoke all on function public.cb2_torneio_salvar(jsonb)    from public, anon, authenticated;
grant execute on function public.cb2_torneio_ler()         to service_role;
grant execute on function public.cb2_torneio_salvar(jsonb) to service_role;
