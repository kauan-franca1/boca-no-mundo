// GET  /api/ideias  → ideias aprovadas com o número de curtidas
// POST /api/ideias  → envia uma ideia nova (fica pendente até a chapa aprovar)
const { banco, idConexao, corpo, responde, protege, CAMPI } = require('./_db');

module.exports = (req, res) => protege(res, async () => {
  if (req.method === 'GET') {
    const lista = await banco.listar('aprovada');
    lista.sort((a, b) => b.curtidas - a.curtidas || b.criada - a.criada);
    return responde(res, 200, { ideias: lista });
  }
  if (req.method === 'POST') {
    const b = corpo(req);
    const texto = String(b.texto || '').replace(/\s+/g, ' ').trim();
    const campus = CAMPI[b.campus] ? b.campus : 'ambos';
    if (b.site) return responde(res, 201, { ok: true });            // campo-isca contra robôs
    if (texto.length < 10) return responde(res, 400, { erro: 'Escreve um pouco mais (mínimo de 10 letras).' });
    if (texto.length > 280) return responde(res, 400, { erro: 'Ideia muito longa (máximo de 280 letras).' });
    if (await banco.passouLimite('ideia:' + idConexao(req), 5, 3600))
      return responde(res, 429, { erro: 'Você já mandou várias ideias agora. Tente de novo mais tarde.' });
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    await banco.novaIdeia(id, texto, campus);
    return responde(res, 201, { ok: true });
  }
  res.setHeader('Allow', 'GET, POST');
  responde(res, 405, { erro: 'Método não permitido' });
});
