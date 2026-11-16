// Banco de memória que imita as funções do Supabase (supabase/*.sql) para testes locais.
const ideias = new Map();      // id -> {id,texto,campus,criada,status}
const curtidas = new Map();    // id -> Map(cliente -> conexao)
const limites = new Map();     // chave -> {n, expira}

const contaLimite = (chave, segundos) => {
  const agora = Date.now(); let l = limites.get(chave);
  if (!l || l.expira < agora) l = { n: 0, expira: agora + segundos * 1000 };
  l.n++; limites.set(chave, l); return l.n;
};

module.exports = {
  async passouLimite(chave, max, segundos) { return contaLimite(chave, segundos) > max; },
  async novaIdeia(id, texto, campus) { ideias.set(id, { id, texto, campus, criada: Date.now(), status: 'pendente' }); },
  async listar(status) {
    return [...ideias.values()].filter(i => i.status === status).map(i => ({ ...i, curtidas: (curtidas.get(i.id) || new Map()).size }));
  },
  async curtir(id, cliente, conexao, curtir, maxRede) {
    const i = ideias.get(id); if (!i || i.status !== 'aprovada') return -1;
    const m = curtidas.get(id) || new Map();
    if (curtir) {
      if (!m.has(cliente) && [...m.values()].filter(c => c === conexao).length >= maxRede) return -2;
      m.set(cliente, conexao);
    } else m.delete(cliente);
    curtidas.set(id, m); return m.size;
  },
  async moderar(id, acao) {
    const i = ideias.get(id); if (!i) return false;
    if (acao === 'aprovar' && i.status === 'pendente') { i.status = 'aprovada'; return true; }
    if ((acao === 'recusar' && i.status === 'pendente') || (acao === 'remover' && i.status === 'aprovada')) { ideias.delete(id); curtidas.delete(id); return true; }
    return false;
  },
  async adminEspera(conexao) {
    const l = limites.get('admin-espera:' + conexao);
    return l && l.expira > Date.now() ? Math.ceil((l.expira - Date.now()) / 1000) : 0;
  },
  async adminTentativa(conexao, ok) {
    if (ok) { limites.delete('admin-falhas:' + conexao); limites.delete('admin-espera:' + conexao); return 0; }
    const n = contaLimite('admin-falhas:' + conexao, 86400);
    if (n <= 5) return 0;
    const espera = Math.min(15 * 2 ** (n - 6), 300);
    limites.set('admin-espera:' + conexao, { n: 1, expira: Date.now() + espera * 1000 });
    return espera;
  },
  // só para o teste: zera tudo e põe ideias de exemplo já aprovadas
  _reset() { ideias.clear(); curtidas.clear(); limites.clear(); },
  _exemplos(lista) { lista.forEach(([id, texto, campus, n, dias]) => { ideias.set(id, { id, texto, campus, criada: Date.now() - dias * 864e5, status: 'aprovada' }); curtidas.set(id, new Map(Array.from({ length: n }, (_, k) => ['exemplo-cliente-' + k, 'rede-exemplo-' + k]))); }); }
};
