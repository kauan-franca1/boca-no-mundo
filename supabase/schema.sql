-- Ideias da galera · Chapa 2 Boca no Mundo
-- Rode este arquivo uma vez no SQL Editor do Supabase.
-- Tudo fica fechado ao público (RLS sem políticas); só a API da Vercel, com a chave de serviço, acessa.

create table if not exists public.cb2_ideias (
  id      text primary key,
  texto   text not null check (char_length(texto) between 10 and 280),
  campus  text not null default 'ambos' check (campus in ('ambos','sa','sbc')),
  criada  timestamptz not null default now(),
  status  text not null default 'pendente' check (status in ('pendente','aprovada'))
);

create table if not exists public.cb2_curtidas (
  ideia_id text not null references public.cb2_ideias(id) on delete cascade,
  cliente  text not null,
  criada   timestamptz not null default now(),
  primary key (ideia_id, cliente)
);

create table if not exists public.cb2_limites (
  chave  text primary key,
  n      integer not null,
  expira timestamptz not null
);

alter table public.cb2_ideias   enable row level security;
alter table public.cb2_curtidas enable row level security;
alter table public.cb2_limites  enable row level security;

-- lista ideias de um status com o total de curtidas
create or replace function public.cb2_listar(p_status text)
returns table (id text, texto text, campus text, criada timestamptz, curtidas bigint)
language sql stable set search_path = public as $$
  select i.id, i.texto, i.campus, i.criada, count(c.cliente)
  from cb2_ideias i left join cb2_curtidas c on c.ideia_id = i.id
  where i.status = p_status
  group by i.id;
$$;

-- curte/descurte (1 por cliente); devolve o total, ou -1 se a ideia não está publicada
create or replace function public.cb2_curtir(p_id text, p_cliente text, p_curtir boolean)
returns integer language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from cb2_ideias where id = p_id and status = 'aprovada') then return -1; end if;
  if p_curtir then
    insert into cb2_curtidas (ideia_id, cliente) values (p_id, p_cliente) on conflict do nothing;
  else
    delete from cb2_curtidas where ideia_id = p_id and cliente = p_cliente;
  end if;
  return (select count(*) from cb2_curtidas where ideia_id = p_id);
end $$;

-- conta tentativas numa janela; devolve true se passou do limite
create or replace function public.cb2_limite(p_chave text, p_max integer, p_segundos integer)
returns boolean language plpgsql set search_path = public as $$
declare v integer;
begin
  delete from cb2_limites where expira < now() - interval '1 day';
  insert into cb2_limites (chave, n, expira) values (p_chave, 1, now() + make_interval(secs => p_segundos))
  on conflict (chave) do update set
    n      = case when cb2_limites.expira < now() then 1 else cb2_limites.n + 1 end,
    expira = case when cb2_limites.expira < now() then now() + make_interval(secs => p_segundos) else cb2_limites.expira end
  returning n into v;
  return v > p_max;
end $$;

-- moderação: 'aprovar' | 'recusar' | 'remover'; devolve true se fez algo
create or replace function public.cb2_moderar(p_id text, p_acao text)
returns boolean language plpgsql set search_path = public as $$
begin
  if p_acao = 'aprovar' then update cb2_ideias set status = 'aprovada' where id = p_id and status = 'pendente';
  elsif p_acao = 'recusar' then delete from cb2_ideias where id = p_id and status = 'pendente';
  elsif p_acao = 'remover' then delete from cb2_ideias where id = p_id and status = 'aprovada';
  else return false; end if;
  return found;
end $$;

-- só a chave de serviço (usada pela API) pode chamar as funções
revoke all on function public.cb2_listar(text)                  from public, anon, authenticated;
revoke all on function public.cb2_curtir(text, text, boolean)   from public, anon, authenticated;
revoke all on function public.cb2_limite(text, integer, integer) from public, anon, authenticated;
revoke all on function public.cb2_moderar(text, text)           from public, anon, authenticated;
grant execute on function public.cb2_listar(text)                  to service_role;
grant execute on function public.cb2_curtir(text, text, boolean)   to service_role;
grant execute on function public.cb2_limite(text, integer, integer) to service_role;
grant execute on function public.cb2_moderar(text, text)           to service_role;
