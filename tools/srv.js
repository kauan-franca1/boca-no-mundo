const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const IMG=process.argv[2], OUT=process.argv[3], TOOL=__dirname;

// ---- teste local da API: banco de mentira + senha de teste gerada (fica em tools/.senha-teste) ----
const fakeRedis=require('./fake-redis');
const arqSenha=path.join(TOOL,'.senha-teste');
if(!fs.existsSync(arqSenha))fs.writeFileSync(arqSenha,'teste-'+crypto.randomBytes(6).toString('hex'));
process.env.CB2_BANCO_MEMORIA=path.join(TOOL,'banco-memoria.js');
process.env.ADMIN_SENHA=fs.readFileSync(arqSenha,'utf8').trim();
// cabeçalhos do vercel.json (localmente o iframe de teste é permitido)
const CAB=JSON.parse(fs.readFileSync('vercel.json','utf8')).headers[0].headers.map(h=>[h.key,h.value.replace("frame-ancestors 'none'","frame-ancestors 'self'").replace(/^DENY$/,'SAMEORIGIN')]);
const aplica=r=>CAB.forEach(([k,v])=>r.setHeader(k,v));
const ROTAS={'/api/ideias':'ideias','/api/curtir':'curtir','/api/admin':'admin','/api/torneio':'torneio'};

http.createServer((q,r)=>{
  let u=decodeURIComponent(q.url.split('?')[0]);
  if(u==='/teste/reset'){require('./banco-memoria.js')._reset();return r.end('ok')}
  if(u==='/teste/exemplos'){require('./banco-memoria.js')._exemplos([['ex1aaaa','Bicicletário coberto no campus São Bernardo','sbc',7,1],['ex2bbbb','Tomadas em todas as mesas da biblioteca de Santo André','sa',4,2],['ex3cccc','Ônibus fretado entre os campi em mais horários','ambos',2,3]]);return r.end('ok')}
  if(u==='/fake-redis/pipeline'){let b='';q.on('data',d=>b+=d);q.on('end',()=>{r.setHeader('Content-Type','application/json');r.end(JSON.stringify(fakeRedis(JSON.parse(b))))});return;}
  if(ROTAS[u]){let b='';q.on('data',d=>b+=d);q.on('end',()=>{q.body=b;delete require.cache[require.resolve('../api/'+ROTAS[u]+'.js')];require('../api/'+ROTAS[u]+'.js')(q,r)});return;}
  if(u==='/admin.html'){aplica(r);r.setHeader('Content-Type','text/html');return fs.createReadStream('admin.html').pipe(r)}
  if(q.method==='POST'){let b='';q.on('data',d=>b+=d);q.on('end',()=>{const {name,data}=JSON.parse(b);fs.writeFileSync(path.join(OUT,name),Buffer.from(data.split(',')[1],'base64'));r.end('ok')});return;}
  if(u==='/regulamento-fifa.pdf'){r.setHeader('Content-Type','application/pdf');return fs.createReadStream('regulamento-fifa.pdf').pipe(r)}
  if(u.startsWith('/galeria/')){const g=path.join(process.cwd(),u.slice(1));if(!fs.existsSync(g)){r.statusCode=404;return r.end()}r.setHeader('Content-Type','image/webp');return fs.createReadStream(g).pipe(r)}
  if(u==='/site'){aplica(r);r.setHeader('Content-Type','text/html');return fs.createReadStream('index.html').pipe(r)}
  let f=u.startsWith('/img/')?path.join(IMG,u.slice(5)):u.startsWith('/out/')?path.join(OUT,u.slice(5)):path.join(TOOL,u==='/'?'crop.html':u.slice(1));
  if(!fs.existsSync(f)){r.statusCode=404;return r.end()}
  const t={'.html':'text/html','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.pdf':'application/pdf','.js':'text/javascript'}[path.extname(f)]||'application/octet-stream';
  r.setHeader('Content-Type',t);fs.createReadStream(f).pipe(r);
}).listen(5178);
