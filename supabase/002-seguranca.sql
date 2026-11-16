-- Migração 002 · ajustes de segurança (rodar uma vez no SQL Editor, depois do schema.sql)

-- 1) curtidas guardam o código (irreversível) da conexão, para limitar por rede e por ideia
alter table public.cb2_curtidas add column if not exists conexao text not null default '';
create index if not exists cb2_curtidas_conexao on public.cb2_curtidas (ideia_id, conexao);

-- (a versão antiga de cb2_curtir com 3 parâmetros é removida no 003, depois que o site novo estiver no ar)

-- devolve o total; -1 = ideia não publicada; -2 = esta rede já curtiu o máximo desta ideia
create or replace function public.cb2_curtir(p_id text, p_cliente text, p_conexao text, p_curtir boolean, p_max_rede integer)
returns integer language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from cb2_ideias where id = p_id and status = 'aprovada') then return -1; end if;
  if p_curtir then
    if not exists (select 1 from cb2_curtidas where ideia_id = p_id and cliente = p_cliente)
       and (select count(*) from cb2_curtidas where ideia_id = p_id and conexao = p_conexao) >= p_max_rede then
      return -2;
    end if;
    insert into cb2_curtidas (ideia_id, cliente, conexao) values (p_id, p_cliente, p_conexao) on conflict do nothing;
  else
    delete from cb2_curtidas where ideia_id = p_id and cliente = p_cliente;
  end if;
  return (select count(*) from cb2_curtidas where ideia_id = p_id);
end $$;

-- 2) painel: espera progressiva por conexão depois de 5 senhas erradas (15 s, 30 s, 60 s… até 5 min)
-- devolve quantos segundos a conexão ainda precisa esperar (0 = pode tentar)
create or replace function public.cb2_admin_espera(p_conexao text)
returns integer language sql stable set search_path = public as $$
  select coalesce((select greatest(0, ceil(extract(epoch from (expira - now()))))::integer
                   from cb2_limites where chave = 'admin-espera:' || p_conexao and expira > now()), 0);
$$;

-- registra uma tentativa; se errou, devolve a espera aplicada a partir de agora
create or replace function public.cb2_admin_tentativa(p_conexao text, p_ok boolean)
returns integer language plpgsql set search_path = public as $$
declare v_n integer; espera integer := 0;
begin
  if p_ok then
    delete from cb2_limites where chave in ('admin-falhas:' || p_conexao, 'admin-espera:' || p_conexao);
    return 0;
  end if;
  insert into cb2_limites (chave, n, expira) values ('admin-falhas:' || p_conexao, 1, now() + interval '1 day')
  on conflict (chave) do update set
    n = case when cb2_limites.expira < now() then 1 else cb2_limites.n + 1 end,
    expira = case when cb2_limites.expira < now() then now() + interval '1 day' else cb2_limites.expira end
  returning cb2_limites.n into v_n;
  if v_n > 5 then
    espera := least(15 * power(2, v_n - 6), 300)::integer;
    insert into cb2_limites (chave, n, expira) values ('admin-espera:' || p_conexao, 1, now() + make_interval(secs => espera))
    on conflict (chave) do update set expira = excluded.expira;
  end if;
  return espera;
end $$;

revoke all on function public.cb2_curtir(text, text, text, boolean, integer) from public, anon, authenticated;
revoke all on function public.cb2_admin_espera(text)                         from public, anon, authenticated;
revoke all on function public.cb2_admin_tentativa(text, boolean)             from public, anon, authenticated;
grant execute on function public.cb2_curtir(text, text, text, boolean, integer) to service_role;
grant execute on function public.cb2_admin_espera(text)                         to service_role;
grant execute on function public.cb2_admin_tentativa(text, boolean)             to service_role;
