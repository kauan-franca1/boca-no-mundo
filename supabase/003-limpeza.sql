-- Migração 003 · rodar DEPOIS de publicar o site com a API nova
-- remove a versão antiga de cb2_curtir (sem limite por rede)
drop function if exists public.cb2_curtir(text, text, boolean);
