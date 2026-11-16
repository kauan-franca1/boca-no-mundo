// Ajudantes compartilhados pelas funções da API (arquivos com "_" não viram rota na Vercel).
// Banco: Supabase (tabelas e funções em supabase/schema.sql). A conexão vem das variáveis
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY, criadas pela integração Supabase da Vercel.
const crypto = require('crypto');

const SB_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';

async function sb(caminho, corpoJson, extra = {}) {
  if (!SB_URL || !SB_KEY) { const e = new Error('banco não configurado'); e.status = 503; throw e; }
  const r = await fetch(SB_URL + '/rest/v1/' + caminho, {
    method: 'POST',
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', ...extra },
    body: JSON.stringify(corpoJson)
  });
  if (!r.ok) { const e = new Error('erro no banco: ' + r.status + ' ' + (await r.text()).slice(0, 200)); e.status = 502; throw e; }
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
const rpc = (fn, args) => sb('rpc/' + fn, args);

// ----- operações usadas pelas rotas -----
const banco = {
  async passouLimite(chave, max, segundos) { return !!(await rpc('cb2_limite', { p_chave: chave, p_max: max, p_segundos: segundos })); },
  async novaIdeia(id, texto, campus) { await sb('cb2_ideias', { id, texto, campus }, { Prefer: 'return=minimal' }); },
  async listar(status) {
    const linhas = await rpc('cb2_listar', { p_status: status }) || [];
    return linhas.map(l => ({ id: l.id, texto: l.texto, campus: l.campus, criada: Date.parse(l.criada), curtidas: Number(l.curtidas) }));
  },
  async curtir(id, cliente, curtir) { return Number(await rpc('cb2_curtir', { p_id: id, p_cliente: cliente, p_curtir: curtir })); },
  async moderar(id, acao) { return !!(await rpc('cb2_moderar', { p_id: id, p_acao: acao })); }
};

// Teste local: o servidor de testes troca o banco por um de memória (ver tools/banco-memoria.js).
if (process.env.CB2_BANCO_MEMORIA) Object.assign(banco, require(process.env.CB2_BANCO_MEMORIA));

// IP vira um código irreversível: serve para limitar abuso sem guardar o IP de ninguém.
function idConexao(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  return crypto.createHash('sha256').update('boca-no-mundo:' + ip).digest('hex').slice(0, 24);
}

function corpo(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch { return {}; }
}

function responde(res, status, dados) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(dados));
}

async function protege(res, fn) {
  try { await fn(); }
  catch (e) {
    if (e.status !== 503) console.error(e);
    responde(res, e.status || 500, { erro: e.status === 503 ? 'As ideias da galera ainda não foram ativadas.' : 'Algo deu errado. Tente de novo.' });
  }
}

const CAMPI = { ambos: 'Os dois campi', sa: 'Santo André', sbc: 'São Bernardo' };

module.exports = { banco, idConexao, corpo, responde, protege, CAMPI };
