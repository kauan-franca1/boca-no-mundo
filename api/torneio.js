// Torneio de FIFA
// GET  /api/torneio                         → participantes, sorteio e resultados (público)
// POST /api/torneio { acao, ... } + x-senha → área da chapa:
//   acao 'participantes' { lista:[nomes] }   (até 20, só antes do sorteio)
//   acao 'sortear'                            (precisa de 16 nomes; sorteia J1–J16 uma vez)
//   acao 'times' { jogo, refazer }            (sorteia o time de cada lado da partida, sem repetir)
//   acao 'lados' { jogo, a, b }               (ajuste manual de quem joga; '' = pela chave)
//   acao 'desfazer'                           (apaga o sorteio e os resultados)
//   acao 'resultado' { jogo, v:'a'|'b'|'', placar }
const crypto = require('crypto');
const { banco, idConexao, corpo, responde, protege } = require('./_db');

// oitavas (O1–O8), quartas (Q1–Q4), semis (S1–S2) e final (F)
const JOGOS = ['O1','O2','O3','O4','O5','O6','O7','O8','Q1','Q2','Q3','Q4','S1','S2','F'];
const TIMES = ["Real Madrid","Manchester City","Barcelona","Bayern de Munique","Liverpool","Arsenal","PSG","Seleção livre"];
const VAGAS = 16;

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
  resultados: (d && d.resultados && typeof d.resultados === 'object') ? d.resultados : {},
  times: (d && d.times && typeof d.times === 'object') ? d.times : {},
  lados: (d && d.lados && typeof d.lados === 'object') ? d.lados : {},
  preferencias: (d && d.preferencias && typeof d.preferencias === 'object') ? d.preferencias : {}
});
// horário de cada vaga nas oitavas (J1/J2 jogam a O1 às 17:15, J3/J4 a O2 às 17:23…)
const HORA_OITAVA = ['17:15','17:23','17:31','17:39','17:47','17:55','18:03','18:11'].map(h => +h.slice(0, 2) * 60 + +h.slice(3));
// lê "Nome | 1º jogo" e "Nome | após 18:00"
function lePreferencia(linha) {
  const [nome, ...resto] = String(linha || '').split('|');
  const op = resto.join(' ').toLowerCase(), p = {};
  if (/1[ºo°]?\s*jogo|primeir/.test(op)) p.primeiro = true;
  const m = op.match(/ap[óo]s\s*(\d{1,2})\s*[:h]?\s*(\d{2})?/);
  if (m) p.apos = (+m[1]) * 60 + (+(m[2] || 0));
  return [nome.replace(/\s+/g, ' ').trim().slice(0, 40), p];
}
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
    const lidas = b.lista.map(lePreferencia).filter(([n]) => n);
    const lista = lidas.map(([n]) => n);
    const prefs = Object.fromEntries(lidas.filter(([, p]) => Object.keys(p).length).map(([n, p]) => [n, p]));
    if (Object.values(prefs).filter(p => p.primeiro).length > 2) return erro(res, 400, 'Só 2 pessoas podem estar no 1º jogo.');
    if (lista.length > VAGAS) return erro(res, 400, 'São no máximo ' + VAGAS + ' participantes (veio ' + lista.length + ').');
    const vistos = new Set();
    for (const n of lista) { const k = n.toLowerCase(); if (vistos.has(k)) return erro(res, 400, 'Nome repetido: ' + n); vistos.add(k); }
    d.participantes = lista; d.preferencias = prefs;
  } else if (b.acao === 'sortear') {
    if (d.sorteio) return erro(res, 409, 'O sorteio já foi feito.');
    if (d.participantes.length !== VAGAS) return erro(res, 400, 'O sorteio precisa de ' + VAGAS + ' participantes (agora são ' + d.participantes.length + ').');
    // quem pediu o 1º jogo fica com J1/J2; o resto é embaralhado respeitando os horários pedidos ("após 18:00")
    const pf = d.preferencias || {};
    const primeiros = d.participantes.filter(n => pf[n] && pf[n].primeiro);
    const resto = d.participantes.filter(n => !primeiros.includes(n));
    const embaralha = l => { for (let i = l.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1); [l[i], l[j]] = [l[j], l[i]]; } return l; };
    const serve = l => l.every((n, i) => !(pf[n] && pf[n].apos) || HORA_OITAVA[Math.floor(i / 2)] >= pf[n].apos);
    let nomes = null;
    for (let tentativa = 0; tentativa < 5000 && !nomes; tentativa++) {
      const l = [...embaralha([...primeiros]), ...embaralha([...resto])];
      if (serve(l)) nomes = l;
    }
    if (!nomes) return erro(res, 400, 'Não deu para respeitar todos os horários pedidos. Revise os "após" na lista.');
    d.sorteio = Object.fromEntries(nomes.map((n, i) => ['J' + (i + 1), n]));
    d.sorteadoEm = new Date().toISOString();
    d.resultados = {}; d.times = {}; d.lados = {};
  } else if (b.acao === 'desfazer') {
    d.sorteio = null; d.sorteadoEm = null; d.resultados = {}; d.times = {}; d.lados = {};
  } else if (b.acao === 'lados') {
    const jogo = String(b.jogo || ''), la = String(b.a || ''), lb = String(b.b || '');
    if (!JOGOS.includes(jogo)) return erro(res, 400, 'Pedido inválido');
    if (!d.sorteio) return erro(res, 409, 'Faça o sorteio dos jogadores antes.');
    if ([la, lb].some(n => n && !d.participantes.includes(n))) return erro(res, 400, 'Escolha um participante da lista.');
    if (la && la === lb) return erro(res, 400, 'Os dois lados não podem ser a mesma pessoa.');
    if (la || lb) d.lados[jogo] = Object.assign({}, la ? { a: la } : {}, lb ? { b: lb } : {}); else delete d.lados[jogo];
  } else if (b.acao === 'times') {
    // sorteia o time de cada lado da partida: 2 times diferentes entre os 8
    const jogo = String(b.jogo || '');
    if (!JOGOS.includes(jogo)) return erro(res, 400, 'Pedido inválido');
    if (!d.sorteio) return erro(res, 409, 'Faça o sorteio dos jogadores antes.');
    if (d.times[jogo] && !b.refazer) return erro(res, 409, 'Os times dessa partida já foram sorteados.');
    const a = crypto.randomInt(TIMES.length); let c = crypto.randomInt(TIMES.length - 1); if (c >= a) c++;
    d.times[jogo] = { a: TIMES[a], b: TIMES[c], em: new Date().toISOString() };
  } else if (b.acao === 'resultado') {
    const jogo = String(b.jogo || ''), v = String(b.v || '');
    if (!JOGOS.includes(jogo) || !['a', 'b', ''].includes(v)) return erro(res, 400, 'Pedido inválido');
    if (!d.sorteio) return erro(res, 409, 'Faça o sorteio antes de lançar resultados.');
    const placar = String(b.placar || '').replace(/[^0-9xX ().,pênaPÊNA:-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
    // mantém a vaga cedida (resultados[jogo].cedeu) se o vencedor continuar o mesmo
    const antes = d.resultados[jogo], cedeu = antes && antes.v === v && antes.cedeu;
    if (v) d.resultados[jogo] = Object.assign(placar ? { v, placar } : { v }, cedeu ? { cedeu } : {}); else delete d.resultados[jogo];
  } else {
    return erro(res, 400, 'Ação inválida');
  }
  await banco.torneioSalvar(d);
  responde(res, 200, d);
});
