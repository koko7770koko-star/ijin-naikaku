// 報告書の写真の印刷の確認：写真12枚・説明が長いものを含む月報を A4 の PDF にして、写真と説明が同じ組のまま（figure が割れない設定）・見出し「8. 写真」だけがページ末に残らない設定・
// 390px でも写真が横にはみ出さないことを確かめる。usage: node hozen/tools/repphotoscheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{const mk=i=>{const cv=document.createElement('canvas');cv.width=160;cv.height=120;const x=cv.getContext('2d');x.fillStyle='hsl('+(i*30)+',50%,60%)';x.fillRect(0,0,160,120);return cv.toDataURL('image/png')};
  const ym=TODAY.slice(0,7);S.tasks=[...Array(12)].map((_,i)=>{PH['rp'+i]=mk(i);return {id:'t'+i,date:ym+'-'+String(1+i).padStart(2,'0'),time:'',kind:'月次',cat:'',title:'点検の試し'+i+(i%4===0?'（名前の長い項目 受変電設備 高圧交流負荷開閉器の絶縁抵抗測定）':''),place:'',staff:'',attend:'',status:'完了',result:'良',note:'',photos:['rp'+i]}});
  S.settings.repPhotos=true;V.ry=now.getFullYear();V.rm=now.getMonth()+1;go('report')});await p.waitForTimeout(500);
 const n=await p.evaluate(()=>({f:document.querySelectorAll('.rph figure').length,w:document.documentElement.scrollWidth,iw:[...document.querySelectorAll('.rph img')].every(i=>i.getBoundingClientRect().right<=innerWidth+1)}));
 if(n.f!==12)bad.push('写真が '+n.f+' 枚（12枚のはず）');if(n.w>392||!n.iw)bad.push('390pxで横にはみ出す');
 await p.emulateMedia({media:'print'});
 const css=await p.evaluate(()=>{const f=document.querySelector('.rph figure'),h=[...document.querySelectorAll('.rep .sec')].find(e=>/8\. 写真/.test(e.textContent));return {fb:getComputedStyle(f).breakInside,hb:h?getComputedStyle(h).breakAfter:'none',ib:getComputedStyle(f.querySelector('img')).breakAfter}});
 if(css.fb!=='avoid')bad.push('写真と説明が割れる設定: '+css.fb);if(css.hb!=='avoid')bad.push('見出し「8. 写真」が単独でページ末に残る設定: '+css.hb);
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});if(buf.length<5000)bad.push('PDFが作れない');
 if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
