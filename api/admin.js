// Área da chapa (pede a senha definida na variável ADMIN_SENHA da Vercel)
// GET  /api/admin                     → ideias pendentes e aprovadas
// POST /api/admin { id, acao }        → acao: 'aprovar' | 'recusar' | 'remover'
//
// Contra adivinhação de senha: 5 erros livres por conexão; depois, espera progressiva
// (15 s, 30 s, 60 s… até 5 min). Só conta como erro quando alguém realmente mandou uma senha:
// páginas de outros sites não conseguem mandar esse cabeçalho, então não conseguem travar o painel.
const crypto = require('crypto');
const { banco, idConexao, corpo, responde, protege } = require('./_db');

function senhaOk(dada) {
  const certa = process.env.ADMIN_SENHA || '';
  if (!certa) return false;
  const a = crypto.createHash('sha256').update(certa).digest(), b = crypto.createHash('sha256').update(dada).digest();
  return crypto.timingSafeEqual(a, b);
}

module.exports = (req, res) => protege(res, async () => {
  if (req.method !== 'GET' && req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return responde(res, 405, { erro: 'Método não permitido' }); }
  res.setHeader('X-Robots-Tag', 'noindex');
  const dada = String(req.headers['x-senha'] || '');
  if (!dada) return responde(res, 401, { erro: 'Senha necessária' });

  const conexao = idConexao(req);
  const espera = await banco.adminEspera(conexao);
  if (espera > 0) { res.setHeader('Retry-After', String(espera)); return responde(res, 429, { erro: 'Muitas tentativas. Espere ' + espera + ' segundos.' }); }

  const ok = senhaOk(dada);
  await banco.adminTentativa(conexao, ok);
  if (!ok) return responde(res, 401, { erro: 'Senha incorreta' });

  if (req.method === 'GET') {
    const [pendentes, aprovadas] = await Promise.all([banco.listar('pendente'), banco.listar('aprovada')]);
    pendentes.sort((a, b) => a.criada - b.criada);
    aprovadas.sort((a, b) => b.curtidas - a.curtidas);
    return responde(res, 200, { pendentes, aprovadas });
  }
  const { id, acao } = corpo(req);
  if (!/^[a-z0-9]{6,24}$/.test(String(id || ''))) return responde(res, 400, { erro: 'Pedido inválido' });
  if (!['aprovar', 'recusar', 'remover'].includes(acao)) return responde(res, 400, { erro: 'Ação inválida' });
  const fez = await banco.moderar(id, acao);
  if (!fez) return responde(res, 404, { erro: 'Ideia não encontrada nesse estado' });
  responde(res, 200, { ok: true });
});
