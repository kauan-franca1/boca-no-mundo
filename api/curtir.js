// POST /api/curtir  { id, cliente, acao: 'curtir' | 'descurtir' }
// Cada navegador (cliente) curte uma vez cada ideia. Para dificultar robôs:
//  - cada rede (conexão) dá no máximo MAX_REDE curtidas na mesma ideia (o wifi da UFABC junta muita gente num IP só);
//  - cada rede tem um teto de cliques por hora.
const { banco, idConexao, corpo, responde, protege } = require('./_db');
const MAX_REDE = 5, CLIQUES_HORA = 40;

module.exports = (req, res) => protege(res, async () => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return responde(res, 405, { erro: 'Método não permitido' }); }
  const b = corpo(req);
  const id = String(b.id || ''), cliente = String(b.cliente || '');
  if (!/^[a-z0-9]{6,24}$/.test(id) || !/^[a-z0-9-]{16,40}$/.test(cliente)) return responde(res, 400, { erro: 'Pedido inválido' });
  const conexao = idConexao(req);
  if (await banco.passouLimite('curtir:' + conexao, CLIQUES_HORA, 3600)) return responde(res, 429, { erro: 'Muitas curtidas seguidas. Respira e tenta já já.' });
  const curtir = b.acao !== 'descurtir';
  const n = await banco.curtir(id, cliente, conexao, curtir, MAX_REDE);
  if (n === -1) return responde(res, 404, { erro: 'Ideia não encontrada' });
  if (n === -2) return responde(res, 429, { erro: 'Essa ideia já recebeu muitas curtidas desta rede.' });
  responde(res, 200, { curtidas: n, curtiu: curtir });
});
