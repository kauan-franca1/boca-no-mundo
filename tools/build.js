const fs=require('fs');const m={wolf:'wolf.webp',favicon:'favicon.png',wordmark:'wordmark.webp',face:'face.webp',pattern:'pattern.webp',eyes:'eyes.webp',capa:'capa.webp',predio:'predio-lum-o.webp',ceu:'ceu.webp',campus2:'campus2-lum-o.webp',lobo19:'lobo19.webp',chapa2:'chapa2.png',gpredios:'g-predios.jpg',gazul:'g-azul.jpg',gginasio:'g-ginasio.jpg',gfaixa:'g-faixa.jpg',gpredios2:'g-predios2.png',fifaselo:'fifa-selo.webp',fifacartaz:'fifa-cartaz.webp'};
let h=fs.readFileSync('src.html','utf8');
for(const[k,f]of Object.entries(m)){const t=f.endsWith('.png')?'image/png':f.endsWith('.webp')?'image/webp':'image/jpeg';h=h.split('{{'+k+'}}').join('data:'+t+';base64,'+fs.readFileSync('assets/'+f).toString('base64'))}
fs.writeFileSync('index.html',h);console.log((h.length/1024|0)+'KB');
