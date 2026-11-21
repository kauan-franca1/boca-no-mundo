// Torneio de FIFA
// GET  /api/torneio                         → participantes, sorteio e resultados (público)
// POST /api/torneio { acao, ... } + x-senha → área da chapa:
//   acao 'participantes' { lista:[nomes] }   (até 20, só antes do sorteio)
//   acao 'sortear'                            (precisa de 20 nomes; 12 primeiros → J1–J12, 8 últimos → J13–J20, embaralhados)
//   acao 'desfazer'                           (apaga o sorteio e os resultados)
//   acao 'resultado' { jogo, v:'a'|'b'|'', placar }
const crypto = require('crypto');
const { banco, idConexao, corpo, responde, protege } = require('./_db');

// preliminar (P1–P4), oitavas (O1–O8), quartas (Q1–Q4), semis (S1–S2) e final (F)
const JOGOS = ['P1','P2','P3','P4','O1','O2','O3','O4','O5','O6','O7','O8','Q1','Q2','Q3','Q4','S1','S2','F'];
const VAGAS = 20;

function senhaOk(dada) {
  const certa = process.env.ADMIN_SENHA || '';
  if (!certa) return false;
  const a = crypto.createHash('sha256').update(certa).digest(), b = crypto.createHash('sha256').update(dada).digest();
  return crypto.timingSafeEqual(a, b);
}
const arruma = d => ({
  participantes: Array.isArray(d && d.participantes) ? d.participantes : [],
  sorteio: (d && d.sorteio) || null,
  sorteadoEm: (d && d.sorteadoEm) || null,
  resultados: (d && d.resultados && typeof d.resultados === 'object') ? d.resultados : {}
});
const erro = (res, status, msg) => responde(res, status, { erro: msg });

module.exports = (req, res) => protege(res, async () => {
  if (req.method === 'GET') return responde(res, 200, arruma(await banco.torneioLer()));
  if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return erro(res, 405, 'Método não permitido'); }

  // mesma proteção de senha do painel das ideias
  const dada = String(req.headers['x-senha'] || '');
  if (!dada) return erro(res, 401, 'Senha necessária');
  const conexao = idConexao(req);
  const espera = await banco.adminEspera(conexao);
  if (espera > 0) { res.setHeader('Retry-After', String(espera)); return erro(res, 429, 'Muitas tentativas. Espere ' + espera + ' segundos.'); }
  const ok = senhaOk(dada);
  await banco.adminTentativa(conexao, ok);
  if (!ok) return erro(res, 401, 'Senha incorreta');

  const b = corpo(req);
  const d = arruma(await banco.torneioLer());

  if (b.acao === 'ler') return responde(res, 200, d);

  if (b.acao === 'participantes') {
    if (d.sorteio) return erro(res, 409, 'O sorteio já foi feito. Desfaça o sorteio para mudar os nomes.');
    if (!Array.isArray(b.lista)) return erro(res, 400, 'Pedido inválido');
    const lista = b.lista.map(n => String(n || '').replace(/\s+/g, ' ').trim().slice(0, 40)).filter(Boolean);
    if (lista.length > VAGAS) return erro(res, 400, 'São no máximo ' + VAGAS + ' participantes (veio ' + lista.length + ').');
    const vistos = new Set();
    for (const n of lista) { const k = n.toLowerCase(); if (vistos.has(k)) return erro(res, 400, 'Nome repetido: ' + n); vistos.add(k); }
    d.participantes = lista;
  } else if (b.acao === 'sortear') {
    if (d.sorteio) return erro(res, 409, 'O sorteio já foi feito.');
    if (d.participantes.length !== VAGAS) return erro(res, 400, 'O sorteio precisa de ' + VAGAS + ' participantes (agora são ' + d.participantes.length + ').');
    // os 12 primeiros inscritos ficam em J1–J12 (oitavas) e os 8 últimos em J13–J20 (preliminar); o sorteio embaralha dentro de cada grupo
    const embaralha = l => { for (let i = l.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [l[i], l[j]] = [l[j], l[i]]; } return l; };
    const nomes = [...embaralha(d.participantes.slice(0, 12)), ...embaralha(d.participantes.slice(12))];
    d.sorteio = Object.fromEntries(nomes.map((n, i) => ['J' + (i + 1), n]));
    d.sorteadoEm = new Date().toISOString();
    d.resultados = {};
  } else if (b.acao === 'desfazer') {
    d.sorteio = null; d.sorteadoEm = null; d.resultados = {};
  } else if (b.acao === 'resultado') {
    const jogo = String(b.jogo || ''), v = String(b.v || '');
    if (!JOGOS.includes(jogo) || !['a', 'b', ''].includes(v)) return erro(res, 400, 'Pedido inválido');
    if (!d.sorteio) return erro(res, 409, 'Faça o sorteio antes de lançar resultados.');
    const placar = String(b.placar || '').replace(/[^0-9xX ().,pênaPÊNA:-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
    if (v) d.resultados[jogo] = placar ? { v, placar } : { v }; else delete d.resultados[jogo];
  } else {
    return erro(res, 400, 'Ação inválida');
  }
  await banco.torneioSalvar(d);
  responde(res, 200, d);
});
