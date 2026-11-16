# Site da Chapa 2 · Boca no Mundo — Documentação

> Eleições do DCE UFABC 2026 · votação em **25 e 26 de novembro**
> Última atualização deste documento: 16/11/2026

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Endereços e contas](#2-endereços-e-contas)
3. [O que tem no site](#3-o-que-tem-no-site)
4. [Como a chapa usa no dia a dia](#4-como-a-chapa-usa-no-dia-a-dia)
5. [Ideias da galera: moderação](#5-ideias-da-galera-moderação)
6. [Arquitetura técnica](#6-arquitetura-técnica)
7. [Como alterar o conteúdo](#7-como-alterar-o-conteúdo)
8. [Como publicar](#8-como-publicar)
9. [Banco de dados (Supabase)](#9-banco-de-dados-supabase)
10. [API](#10-api)
11. [Segurança](#11-segurança)
12. [Testes locais](#12-testes-locais)
13. [Desempenho e tamanhos](#13-desempenho-e-tamanhos)
14. [Solução de problemas](#14-solução-de-problemas)
15. [Pendências e próximos passos](#15-pendências-e-próximos-passos)
16. [Depois da eleição](#16-depois-da-eleição)
17. [Histórico de versões](#17-histórico-de-versões)

---

## 1. Visão geral

Site de campanha da **Chapa 2 · Boca no Mundo** para o DCE da UFABC. Mostra as propostas, a proposta de gestão (conteúdo do PDF oficial), a agenda de eventos, a galeria de ações e um espaço onde estudantes mandam e curtem ideias.

| Item | Como é |
|---|---|
| Tipo | Site estático (um `index.html` com tudo embutido) + 3 funções de servidor para as ideias |
| Hospedagem | Vercel (plano gratuito), com publicação automática a partir do GitHub |
| Banco de dados | Supabase/PostgreSQL (plano gratuito), só para as "Ideias da galera" |
| Código | Repositório público `kauan-franca1/boca-no-mundo` |
| Custo | R$ 0 (planos gratuitos sobram para o tamanho da campanha) |

---

## 2. Endereços e contas

| O quê | Endereço |
|---|---|
| **Site oficial** | https://boca-no-mundo.vercel.app |
| Abas com link direto | `/#gestao` (Proposta de gestão) · `/#galeria` · `/#eventos` · `/#propostas` |
| **Painel da chapa** (aprovar ideias) | https://boca-no-mundo.vercel.app/admin.html |
| Endereço reserva (GitHub Pages) | https://kauan-franca1.github.io/boca-no-mundo/ — mostra só a parte estática; as ideias não funcionam nele |
| Repositório | https://github.com/kauan-franca1/boca-no-mundo |
| Projeto na Vercel | conta `francajpeg` → projeto **boca-no-mundo** |
| Banco | Vercel → boca-no-mundo → **Storage** → **supabase-bole-xylophone** |
| Instagram da chapa | https://www.instagram.com/chapabocanomundo/ |
| Formulário de sugestões (Google Forms) | link no rodapé do site ("Enviar sugestão") |

**Quem tem acesso a quê**

- **Vercel e GitHub**: conta do Kauan. Recomenda-se ativar verificação em duas etapas nas duas.
- **Supabase**: acessado pelo botão *Open in Supabase* dentro da Vercel (login automático; não tem senha própria).
- **Painel de ideias**: qualquer pessoa com a senha `ADMIN_SENHA` (definida na Vercel; ver seção 5).

---

## 3. O que tem no site

O site tem três abas no menu fixo do topo.

### 3.1 Aba "Propostas" (página inicial)

| Seção | O que faz |
|---|---|
| **Abertura** | Fachada da UFABC retramada em laranja e preto (pontos de 3 px), céu vinho com a estampa da chapa passando devagar, lobo "Boca no Mundo" na fachada com tremor de desenho à mão. **Clicar no prédio** troca para o campus **São Bernardo** com uma transição em pontos de retícula; clicar de novo volta. Na primeira visita, depois de ~6 s parado, a troca acontece sozinha uma vez. Botão "Ver propostas" e ícones de Instagram e WhatsApp. |
| **Próximos eventos** | Cards com data, local, horários e botão "Avisar a galera" (WhatsApp). Cada evento **some sozinho no dia seguinte**; no dia aparece o selo "É hoje". Se não houver eventos futuros, a seção some. |
| **Manifesto** | "Quem estuda aqui tem voz…" com contadores (17 propostas, 4 frentes, 1 chapa). |
| **Propostas** | 17 cards com filtro por frente (Permanência, Ensino e pesquisa, Direitos, Gestão). Botão de WhatsApp em cada card para compartilhar aquela proposta. |
| **Ideias da galera** | Formulário para mandar ideia (vai para aprovação) e lista de ideias aprovadas com curtidas. Ver seção 5. |
| **A chapa da ação** | Duas fotos da galeria que trocam a cada 10 s, com a frase da chapa e link para a galeria. |
| **Vota 2** | Cronômetro até 25/11 às 0h (horário de Brasília). Nos dias 25 e 26 mostra "A votação está aberta: vote 2!"; depois, "Obrigado a todo mundo que votou!". Os olhos de guaraná da estampa piscam; clicar na estampa faz todos piscarem em onda. |
| **Rodapé** | Logo, link "Enviar sugestão" (Google Forms), Instagram e WhatsApp. |

### 3.2 Aba "Proposta de gestão"

Reproduz o PDF "Proposta de gestão 2027" com o mesmo visual (cores, colagem, tabela de pautas) e **o texto idêntico ao PDF**. Inclui os contatos para articulação (telefones de três integrantes — ver seção 15).

### 3.3 Aba "Galeria"

Mural de fotos por ação, a mais recente primeiro. Clicar numa foto abre o visualizador (setas, teclado, arrastar no celular, Esc para fechar).

| Ação | Data | Fotos |
|---|---|---|
| São Brejada | 13/11 | 87 |
| Silkagem | 11/11 · Campus São Bernardo do Campo | 19 |

### 3.4 Prévia de link

Ao compartilhar o site no WhatsApp/Instagram aparece o card com a imagem `og.jpg` (fachada com o lobo + "Votação 25 e 26 de novembro").

---

## 4. Como a chapa usa no dia a dia

| Tarefa | Quem faz | Como |
|---|---|---|
| Aprovar ideias da galera | Moderadores | Painel `/admin.html` (seção 5) |
| Ler sugestões do Google Forms | Quem é dono do formulário | Google Forms → aba **Respostas** (dá para ligar planilha e aviso por e-mail) |
| Novo evento, proposta, fotos ou texto | Pedir ao Kauan / Claude | Seção 7. Mandar o texto exatamente como deve sair. |
| Publicar mudanças | Só com autorização do Kauan | Seção 8 |

**Regra combinada:** nada é publicado sem autorização explícita do Kauan, a cada vez.

---

## 5. Ideias da galera: moderação

### 5.1 Caminho de uma ideia

```
Estudante escreve no site ──► fica PENDENTE (ninguém vê)
                                   │
              Moderador no painel ─┼─► Aprovar ──► aparece no site, todos podem curtir
                                   └─► Recusar ──► apagada para sempre
Ideia publicada ──► "Tirar do site" ──► apagada junto com as curtidas
```

### 5.2 Usando o painel

1. Abra **https://boca-no-mundo.vercel.app/admin.html** (funciona no celular).
2. Digite a senha da chapa. Ela fica guardada só enquanto a aba estiver aberta; **Sair** apaga.
3. **Esperando aprovação**: ideias novas, da mais antiga para a mais nova, com texto, campus e data/hora.
   - **Aprovar** → aparece no site na hora.
   - **Recusar** → apagada (pede confirmação).
4. **No site**: ideias publicadas, das mais curtidas para as menos, com o número de curtidas.
   - **Tirar do site** → apaga a ideia e as curtidas (pede confirmação). Útil quando a ideia já virou proposta oficial ou alguém pediu para retirar.

**Sugestão de critério**: recusar ofensas, ataques pessoais, propaganda de outra chapa, dados pessoais de terceiros e spam. Ideias repetidas: aprovar uma e recusar as cópias.

### 5.3 Regras automáticas (o site aplica sozinho)

| Regra | Valor |
|---|---|
| Tamanho da ideia | de 10 a 280 caracteres |
| Envios por conexão | até 5 por hora |
| Curtidas | 1 por navegador em cada ideia (clicar de novo descurte) |
| Curtidas por rede na mesma ideia | no máximo 5 (o wifi da UFABC junta muita gente num IP só) |
| Cliques de curtir por conexão | até 40 por hora |
| Robôs | campo-isca invisível no formulário |
| Senha errada no painel | 5 erros livres; depois espera de 15 s, 30 s, 60 s… até 5 min (só para aquela rede) |
| Identificação | nenhuma: não guardamos nome nem IP; o IP vira um código irreversível só para os limites acima |

### 5.4 Senha do painel (`ADMIN_SENHA`)

- Fica em **Vercel → boca-no-mundo → Settings → Environment Variables → `ADMIN_SENHA`**, tipo *Secret*, ambientes *Production* e *Preview*.
- Use 16+ caracteres e passe só para quem modera.
- **Trocar a senha**: editar a variável e **republicar** o site (a senha nova só vale depois de uma nova publicação).
- Se esquecer: crie uma nova no mesmo lugar e republique. Ninguém (nem a Vercel) consegue ler a senha salva.

### 5.5 Ver, exportar ou fazer backup das ideias

Vercel → Storage → **supabase-bole-xylophone** → **Open in Supabase** → **Table Editor** → tabela `cb2_ideias` → **Export to CSV**.
Use o painel para aprovar/apagar; o Table Editor é só para consulta e exportação.

---

## 6. Arquitetura técnica

```
GitHub · kauan-franca1/boca-no-mundo
  index.html · admin.html · og.jpg · galeria/ · api/ · vercel.json
  supabase/*.sql (só no repositório; não vai para o site)
        │
        │  push na branch main = publicação automática
        ▼
Vercel · boca-no-mundo.vercel.app   ◄── HTTPS ──  Visitante
  ├─ arquivos estáticos: index.html, admin.html, galeria/, og.jpg
  └─ funções Node: /api/ideias · /api/curtir · /api/admin
        │
        │  chave de serviço (variável secreta na Vercel)
        ▼
Supabase (PostgreSQL) · tabelas cb2_* · funções cb2_* · RLS ativo
```

### 6.1 Arquivos que vão para o site

| Arquivo | Papel |
|---|---|
| `index.html` | O site inteiro (≈1 MB): HTML, CSS, JavaScript e quase todas as imagens embutidas em base64. **Gerado** a partir de `src.html` (seção 7). |
| `admin.html` | Painel de moderação (independente, sem imagens). |
| `og.jpg` | Imagem da prévia de link (1200×630). |
| `galeria/` | Fotos da galeria em WebP: `<ação>-NN.webp` (até 1600 px, para ampliar) e `<ação>-NN-p.webp` (até 640 px, para o mural). |
| `api/_db.js` | Conexão com o Supabase, limites, leitura segura do corpo, respostas padrão. (Arquivos com `_` não viram rota.) |
| `api/ideias.js` | Listar ideias aprovadas / enviar ideia nova. |
| `api/curtir.js` | Curtir / descurtir. |
| `api/admin.js` | Painel: listar, aprovar, recusar, remover (com senha). |
| `vercel.json` | Cabeçalhos de segurança (seção 11). |
| `.vercelignore` | Impede publicar `supabase/`, `tools/`, `assets/`, `src.html` e esta documentação. |

### 6.2 Arquivos de trabalho (fonte)

> Ficam no repositório (desde 16/11, commit `cb955a0`), mas **não vão para o site** por causa do `.vercelignore`.

| Arquivo | Papel |
|---|---|
| `src.html` | **Fonte** do site. É aqui que se edita. Contém marcadores `{{nome}}` onde entram as imagens. |
| `tools/build.js` | Gera `index.html` trocando cada `{{nome}}` pelo arquivo correspondente em `assets/` (em base64). |
| `assets/` | Imagens embutidas (fachadas retramadas, lobo, estampas, ilustrações do PDF etc.). |
| `tools/srv.js`, `tools/banco-memoria.js`, `tools/frame.html` | Servidor de testes local com banco de memória (seção 12). |

### 6.3 Imagens embutidas (`tools/build.js`)

| Marcador | Arquivo | Uso |
|---|---|---|
| `{{predio}}` | `predio-lum-o.webp` | Mapa de tons da fachada de Santo André (a retícula é desenhada no navegador) |
| `{{campus2}}` | `campus2-lum-o.webp` | Mapa de tons do campus São Bernardo |
| `{{ceu}}` | `ceu.webp` | Estampa que passa no céu da abertura |
| `{{lobo19}}` | `lobo19.webp` | Lobo enrolado "Boca no Mundo" (máscara) |
| `{{wolf}}` / `{{favicon}}` | `wolf.webp` / `favicon.png` | Lobo do logo (cards) e ícone da aba |
| `{{wordmark}}`, `{{face}}` | `.webp` | Letreiro "Boca no Mundo" e rosto do lobo (rodapé/menu) |
| `{{pattern}}`, `{{eyes}}` | `.webp` | Estampa laranja dos cards e estampa de olhos do "Vota 2" |
| `{{gpredios}}`, `{{gazul}}`, `{{gginasio}}`, `{{gfaixa}}`, `{{gpredios2}}` | `g-*.jpg/png` | Ilustrações recortadas do PDF da gestão |

---

## 7. Como alterar o conteúdo

Todo o conteúdo editável está em listas no final de `src.html`. Depois de editar: `node tools/build.js` → testar → publicar (seção 8).

### 7.1 Propostas — `const PROPOSTAS=[...]`

Cada linha: `["frente","Rótulo da frente","Título","Texto."]`

- Frentes válidas: `permanencia`, `ensino`, `direitos`, `gestao` (definem o filtro).
- **A ordem da lista é a ordem no site** (hoje: as mais novas/inovadoras primeiro).
- Ao mudar a quantidade, atualizar também os textos "Dezessete propostas…" (abertura) e o contador `<b>17</b>` (manifesto).
- O botão de compartilhar de cada card é gerado automaticamente.

### 7.2 Eventos — `const EVENTOS=[...]`

```js
{titulo:'Marmitaço', dia:16, mes:11, ano:2026, onde:'Nos dois campi',
 horas:[['Almoço','a partir das 11h'],['Janta','a partir das 17h30']],
 desc:'Texto opcional (aceita <strong>)',
 zap:'Texto da mensagem do botão "Avisar a galera"',
 icone:'marmita'}   // marmita | camiseta (com o lobo) | musica (chopp + nota)
```

O evento some no dia seguinte (horário de Brasília). Ordem automática por data.

### 7.3 Galeria — `const ACOES=[...]`

```js
{titulo:'São Brejada', data:'13/11', local:'', prefixo:'brejada',
 fotos:[['04',640,360], ['01',360,640], ...]}   // [número, largura, altura da versão -p]
```

Para uma ação nova:
1. Converter/otimizar as fotos para `galeria/<prefixo>-NN.webp` (1600 px) e `galeria/<prefixo>-NN-p.webp` (640 px). Fotos de iPhone (HEIC) são convertidas pelo Windows (WIC) antes.
2. Adicionar o item **no topo** da lista (a mais recente aparece primeiro).
3. As fotos entram sozinhas na rotação de "A chapa da ação".

### 7.4 Outros pontos editáveis

| O quê | Onde (em `src.html`) |
|---|---|
| Data da votação / cronômetro | `INICIO=Date.UTC(2026,10,25,3,0,0)` e `FIM=Date.UTC(2026,10,27,3,0,0)` (mês começa em 0; 03:00 UTC = 0h em Brasília) |
| Frases do fim da votação | logo abaixo, no mesmo bloco do cronômetro |
| Pautas da proposta de gestão | `const PAUTAS=[...]` — **texto igual ao PDF; não alterar sem novo PDF** |
| Campi da abertura | `const CAMPI=[...]` (imagem, enquadramento, posição do lobo) |
| Links de Instagram/WhatsApp/Forms | buscar por `instagram.com`, `chat.whatsapp.com`, `docs.google.com/forms` |
| Metadados de compartilhamento | `<meta property="og:...">` no topo |

---

## 8. Como publicar

1. Gerar: `node tools/build.js` (cria `index.html`).
2. Testar localmente (seção 12).
3. **Pedir autorização ao Kauan.**
4. Copiar os arquivos alterados para o clone do repositório, fazer commit na branch **`main`** e `git push`.
5. A Vercel publica sozinha em ~20–60 s. Conferir no ar.

Alternativa sem programa: GitHub → **Add file → Upload files** → arrastar `index.html` → **Commit changes** (na `main`).

| Branch | Uso |
|---|---|
| `main` | Site oficial (publicação automática) |
| outras (ex.: `ideias`) | Geram **endereço de prévia** próprio na Vercel, sem mexer no oficial. A `ideias` já foi incorporada e pode ser apagada. |

O GitHub Pages também atualiza a partir da `main` (endereço reserva).

---

## 9. Banco de dados (Supabase)

### 9.1 Tabelas

| Tabela | Colunas | Observação |
|---|---|---|
| `cb2_ideias` | `id` (texto), `texto` (10–280), `campus` (`ambos`/`sa`/`sbc`), `criada`, `status` (`pendente`/`aprovada`) | Recusar/remover apaga a linha |
| `cb2_curtidas` | `ideia_id`, `cliente`, `conexao`, `criada` | Chave única (ideia, cliente). Apagadas junto com a ideia |
| `cb2_limites` | `chave`, `n`, `expira` | Contadores dos limites; linhas com mais de 1 dia vencidas são limpas sozinhas |

### 9.2 Funções

| Função | Faz |
|---|---|
| `cb2_listar(status)` | Lista ideias de um status com total de curtidas |
| `cb2_curtir(id, cliente, conexao, curtir, max_rede)` | Curte/descurte; −1 = ideia não publicada; −2 = rede passou do máximo |
| `cb2_limite(chave, max, segundos)` | Conta tentativas numa janela; `true` = passou do limite |
| `cb2_moderar(id, acao)` | `aprovar` / `recusar` / `remover` |
| `cb2_admin_espera(conexao)` | Segundos que a rede ainda precisa esperar no painel |
| `cb2_admin_tentativa(conexao, ok)` | Registra tentativa de senha e define a espera |

### 9.3 Permissões

- **RLS ativo** nas 3 tabelas e **nenhuma política** → o público não lê nem escreve nada direto no banco.
- As funções têm execução **revogada** de `public`, `anon` e `authenticated`; só `service_role` (usada pela API) executa.
- Verificado em 16/11: Security Advisor do Supabase com 0 erros e 0 avisos.

### 9.4 Migrações (`supabase/`)

| Arquivo | Estado |
|---|---|
| `schema.sql` | ✅ aplicado (15/11) — tabelas e funções iniciais |
| `002-seguranca.sql` | ✅ aplicado (16/11) — coluna `conexao`, limite por rede, espera progressiva do painel  |
| `003-limpeza.sql` | ✅ aplicado (16/11) — removeu a versão antiga de `cb2_curtir` |

Como rodar: Open in Supabase → **SQL Editor** → colar o arquivo → **Run**.

### 9.5 Variáveis de ambiente (Vercel)

| Variável | Origem | Usada? |
|---|---|---|
| `SUPABASE_URL` | Integração Supabase (automática) | ✅ API |
| `SUPABASE_SERVICE_ROLE_KEY` | Integração Supabase (automática, sensível) | ✅ API — **nunca expor** |
| `ADMIN_SENHA` | Criada manualmente | ✅ Painel |
| `POSTGRES_*`, `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`, `NEXT_PUBLIC_*`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` | Integração (automática) | Não usadas pelo site |

---

## 10. API

Todas respondem JSON, com `Cache-Control: no-store`.

| Rota | Método | Corpo | Respostas |
|---|---|---|---|
| `/api/ideias` | GET | — | `200 {ideias:[{id,texto,campus,criada,curtidas}]}` (ordenadas por curtidas) |
| `/api/ideias` | POST | `{texto, campus}` | `201` ok · `400` texto curto/longo/corpo inválido · `429` limite de envios |
| `/api/curtir` | POST | `{id, cliente, acao:'curtir'|'descurtir'}` | `200 {curtidas, curtiu}` · `400` · `404` ideia não publicada · `429` limite |
| `/api/admin` | GET | cabeçalho `x-senha` | `200 {pendentes, aprovadas}` · `401` · `429 + Retry-After` |
| `/api/admin` | POST | `{id, acao}` + `x-senha` | `200` · `400` · `401` · `404` · `429` |
| qualquer | — | — | `503` "ainda não foram ativadas" se o banco não estiver configurado |

`cliente` é um identificador aleatório gerado e guardado no navegador do visitante (`localStorage`).

---

## 11. Segurança

### 11.1 Medidas em vigor

- HTTPS obrigatório com HSTS (Vercel).
- Chave do banco só no servidor (variável sensível); nunca no site nem no repositório (histórico verificado).
- Entradas validadas por formato antes de chegar ao banco; funções com parâmetros (sem SQL montado com texto).
- Textos de visitantes exibidos como **texto puro** (sem risco de injeção de código).
- Senha do painel comparada em tempo constante; limites e espera progressiva contra adivinhação.
- API não libera acesso a outros sites (sem CORS); o painel exige cabeçalho próprio.
- Sem coleta de dados pessoais nas ideias.

### 11.2 Auditoria de 16/11/2026

Nenhuma falha grave. Achados e correções:

| # | Achado | Gravidade | Correção | Estado |
|---|---|---|---|---|
| 1 | Curtidas infladas por robô | Média | Máx. 5 por rede/ideia; 40 cliques/hora | ✅ no ar |
| 2 | Painel embutível em outro site (clickjacking) | Média | `vercel.json`: CSP `frame-ancestors 'none'`, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` | ✅ no ar |
| 3 | Travar o painel pelo wifi compartilhado | Média | Espera progressiva; tentativas sem senha não contam | ✅ no ar |
| 4 | `schema.sql` acessível no site | Baixa | `.vercelignore` | ✅ no ar |
| 5 | JSON quebrado gerava erro 500 | Baixa | Responde 400 | ✅ no ar |
| 6 | Telefones pessoais públicos (aba gestão) | Baixa | Decisão da chapa (consentimento ou links sem número) | ⏳ decisão |

As correções 1–5 foram publicadas em 16/11 (commit `cb955a0`) e conferidas no ar: cabeçalhos presentes, arquivos internos respondem 404, JSON quebrado responde 400, site e painel sem bloqueios da política de segurança.

### 11.3 Boas práticas

- Verificação em duas etapas na **Vercel** e no **GitHub**.
- Senha do painel forte e compartilhada só com moderadores; trocar se alguém sair.
- Revisar o painel uma ou duas vezes por dia na reta final.

---

## 12. Testes locais

O servidor de testes roda o **código real da API** com um banco de memória (nada vai para o Supabase).

- Rodar na pasta do repositório: `node tools/srv.js assets assets` (porta 5178).
- Endereços: `http://localhost:5178/site` (site) · `/admin.html` (painel) · `/frame.html` (simula tamanhos de tela).
- Senha de teste: arquivo `tools/.senha-teste` (gerada automaticamente; não é a senha real).
- `/teste/reset` zera o banco de memória · `/teste/exemplos` cria 3 ideias de exemplo.
- Os cabeçalhos do `vercel.json` também são aplicados localmente (com o iframe de teste liberado).

Roteiro mínimo antes de publicar: desktop 1280×800 e 1536×700, celular 375×812, sem rolagem lateral, console sem erros, trocar campus, abrir galeria, mandar/aprovar/curtir ideia.

---

## 13. Desempenho e tamanhos

| Item | Tamanho |
|---|---|
| `index.html` (tudo embutido) | ≈ 1 MB |
| Galeria (106 fotos × 2 tamanhos) | ≈ 15 MB, carregadas só quando aparecem na tela |
| `og.jpg` | 235 KB |

- A abertura desenha a retícula no tamanho exato da tela (nítida em qualquer resolução) e só redesenha ao mudar o tamanho da janela.
- Animações (céu, olhos, fotos em rotação) pausam fora da tela e respeitam "reduzir movimento" do sistema.

---

## 14. Solução de problemas

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| "As ideias da galera ainda não foram ativadas" | Banco não ligado ou variáveis ausentes | Conferir Storage e variáveis `SUPABASE_*` na Vercel; republicar |
| Painel diz "Senha incorreta" com a senha certa | Senha trocada sem republicar | Republicar o site |
| Painel pede para esperar X segundos | Muitas senhas erradas daquela rede | Esperar (máx. 5 min) ou usar outra rede |
| Curtida não fica | Limite por rede/ideia (wifi compartilhado) ou ideia removida | Normal; tentar em outra rede |
| Prévia antiga no WhatsApp | Cache do WhatsApp/Instagram | Some sozinho com o tempo; em conversas novas já aparece certo |
| Mudança não apareceu no site | Publicou fora da `main` ou cache do navegador | Conferir a branch; recarregar com Ctrl+F5 |
| Prévia de branch pede login da Vercel | Proteção de prévias da Vercel | Normal; o site oficial é aberto |

---

## 15. Pendências e próximos passos

| Prioridade | Pendência |
|---|---|
| 🟡 Média | Decidir sobre os telefones na aba de gestão (consentimento ou links de WhatsApp sem número visível). |
| 🟡 Média | Apagar a branch `ideias` do GitHub (já incorporada). |
| 🟢 Baixa | Ideias sugeridas: botão "Salvar na agenda" nos eventos e na votação; link próprio para cada proposta; contador de visitas (Vercel Analytics); vídeo da São Brejada. |

---

## 16. Depois da eleição

- No dia 27/11 o cronômetro já mostra o agradecimento automaticamente.
- Decidir: manter o site como registro, atualizar com o resultado, ou desativar.
- Ideias: exportar em CSV (seção 5.5) e, se não forem mais usadas, apagar o banco (Vercel → Storage → supabase-bole-xylophone → Settings → Delete). Apagar o banco desativa a seção de ideias (o site mostra o aviso de "em breve").
- Trocar ou remover a `ADMIN_SENHA`.
- Rever a exposição dos telefones pessoais.

---

## 17. Histórico de versões

| Data | Commit | Mudança |
|---|---|---|
| 11/11 | `dbae122` | Primeira versão do site |
| 11/11 | `553ac59` | ReSIGAA e Engenharia no mercado; propostas novas primeiro |
| 11/11 | `895ca3b` | Abertura com os dois campi, cronômetro, prévia de link, compartilhamento |
| 11/11 | `c029cf9` | Sugestões via Google Forms |
| 12/11 | `6932d0a` | Aba Galeria (Silkagem) |
| 13/11 | `0073662` | Seção "A chapa da ação" |
| 13/11 | `fd75ca9` | Próximos eventos |
| 13/11 | `9e232b5` | Ajuste de horário da Silkagem |
| 15/11 | `232eeec` | Propostas: Transporte para competições e Diretoria de Sustentabilidade |
| 15/11 | `0a31ae0` | Ideias da galera no oficial + galeria São Brejada |
| 16/11 | `cb955a0` | Correções de segurança, cabeçalhos e fonte do site no repositório |
