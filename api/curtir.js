// POST /api/curtir  { id, cliente, acao: 'curtir' | 'descurtir' }
// Cada navegador (cliente) curte uma vez cada ideia; a conexão tem limite de cliques por hora.
const { banco, idConexao, corpo, responde, protege } = require('./_db');

module.exports = (req, res) => protege(res, async () => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return responde(res, 405, { erro: 'Método não permitido' }); }
  const b = corpo(req);
  const id = String(b.id || ''), cliente = String(b.cliente || '');
  if (!/^[a-z0-9]{6,24}$/.test(id) || !/^[a-z0-9-]{16,40}$/.test(cliente)) return responde(res, 400, { erro: 'Pedido inválido' });
  if (await banco.passouLimite('curtir:' + idConexao(req), 120, 3600)) return responde(res, 429, { erro: 'Muitas curtidas seguidas. Respira e tenta já já.' });
  const curtir = b.acao !== 'descurtir';
  const n = await banco.curtir(id, cliente, curtir);
  if (n < 0) return responde(res, 404, { erro: 'Ideia não encontrada' });
  responde(res, 200, { curtidas: n, curtiu: curtir });
});
