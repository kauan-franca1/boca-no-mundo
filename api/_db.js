// Ajudantes compartilhados pelas funções da API (arquivos com "_" não viram rota na Vercel).
// Banco: Supabase (tabelas e funções em supabase/schema.sql + supabase/002-seguranca.sql).
// A conexão vem das variáveis SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY, criadas pela integração Supabase da Vercel.
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
  // -1 = ideia não publicada; -2 = esta rede já deu o máximo de curtidas nesta ideia
  async curtir(id, cliente, conexao, curtir, maxRede) {
    return Number(await rpc('cb2_curtir', { p_id: id, p_cliente: cliente, p_conexao: conexao, p_curtir: curtir, p_max_rede: maxRede }));
  },
  async moderar(id, acao) { return !!(await rpc('cb2_moderar', { p_id: id, p_acao: acao })); },
  async adminEspera(conexao) { return Number(await rpc('cb2_admin_espera', { p_conexao: conexao }) || 0); },
  async adminTentativa(conexao, ok) { return Number(await rpc('cb2_admin_tentativa', { p_conexao: conexao, p_ok: ok }) || 0); },
  // torneio de FIFA (supabase/004-torneio.sql)
  async torneioLer() { return (await rpc('cb2_torneio_ler', {})) || {}; },
  async torneioSalvar(dados) { await rpc('cb2_torneio_salvar', { p_dados: dados }); }
};

// Teste local: o servidor de testes troca o banco por um de memória (ver tools/banco-memoria.js).
if (process.env.CB2_BANCO_MEMORIA) Object.assign(banco, require(process.env.CB2_BANCO_MEMORIA));

// IP vira um código irreversível: serve para limitar abuso sem guardar o IP de ninguém.
// Na Vercel, x-forwarded-for é definido pela própria plataforma (o valor enviado pelo visitante é descartado).
function idConexao(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  return crypto.createHash('sha256').update('boca-no-mundo:' + ip).digest('hex').slice(0, 24);
}

function pedidoInvalido() { const e = new Error('pedido inválido'); e.status = 400; return e; }

// Lê o corpo JSON; corpo quebrado vira erro 400 (e não 500)
function corpo(req) {
  let b;
  try { b = req.body; } catch { throw pedidoInvalido(); }      // na Vercel, ler req.body com JSON quebrado lança erro
  if (b && typeof b === 'object') return b;
  if (b == null || b === '') return {};
  try { const o = JSON.parse(b); if (o && typeof o === 'object') return o; } catch {}
  throw pedidoInvalido();
}

function responde(res, status, dados) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(dados));
}

const MENSAGENS = { 400: 'Pedido inválido', 503: 'As ideias da galera ainda não foram ativadas.' };
async function protege(res, fn) {
  try { await fn(); }
  catch (e) {
    if (!MENSAGENS[e.status]) console.error(e);
    responde(res, e.status || 500, { erro: MENSAGENS[e.status] || 'Algo deu errado. Tente de novo.' });
  }
}

const CAMPI = { ambos: 'Os dois campi', sa: 'Santo André', sbc: 'São Bernardo' };

module.exports = { banco, idConexao, corpo, responde, protege, CAMPI };
