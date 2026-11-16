// Área da chapa (pede a senha definida na variável ADMIN_SENHA da Vercel)
// GET  /api/admin                     → ideias pendentes e aprovadas
// POST /api/admin { id, acao }        → acao: 'aprovar' | 'recusar' | 'remover'
const crypto = require('crypto');
const { banco, idConexao, corpo, responde, protege } = require('./_db');

function senhaOk(req) {
  const certa = process.env.ADMIN_SENHA || '';
  const dada = String(req.headers['x-senha'] || '');
  if (!certa) return false;
  const a = crypto.createHash('sha256').update(certa).digest(), b = crypto.createHash('sha256').update(dada).digest();
  return crypto.timingSafeEqual(a, b);
}

module.exports = (req, res) => protege(res, async () => {
  if (!senhaOk(req)) {
    if (await banco.passouLimite('admin:' + idConexao(req), 10, 3600)) return responde(res, 429, { erro: 'Muitas tentativas. Espere uma hora.' });
    return responde(res, 401, { erro: 'Senha incorreta' });
  }
  if (req.method === 'GET') {
    const [pendentes, aprovadas] = await Promise.all([banco.listar('pendente'), banco.listar('aprovada')]);
    pendentes.sort((a, b) => a.criada - b.criada);
    aprovadas.sort((a, b) => b.curtidas - a.curtidas);
    return responde(res, 200, { pendentes, aprovadas });
  }
  if (req.method === 'POST') {
    const { id, acao } = corpo(req);
    if (!/^[a-z0-9]{6,24}$/.test(String(id || ''))) return responde(res, 400, { erro: 'Pedido inválido' });
    if (!['aprovar', 'recusar', 'remover'].includes(acao)) return responde(res, 400, { erro: 'Ação inválida' });
    const fez = await banco.moderar(id, acao);
    if (!fez) return responde(res, 404, { erro: 'Ideia não encontrada nesse estado' });
    return responde(res, 200, { ok: true });
  }
  res.setHeader('Allow', 'GET, POST');
  responde(res, 405, { erro: 'Método não permitido' });
});
