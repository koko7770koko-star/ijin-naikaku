// 設備の場所（locs）の木を 棟→階→電気室→盤 で開いたとき、文字「大」「特大」・360px で（hz-xl-review-12）
// ①深い段（電気室・盤）の名前の欄が細くなりすぎて1文字ずつ縦に割れない（名前の欄が 3 文字ぶん以上）
// ②「ぜんぶ たたむ」「ぜんぶ ひらく」が言葉の途中（「たた/む」）で割れない（折れてよいのは空白の所）
// 標準・390px は名前の欄が細くならないこととはみ出さないことを見る。
// usage: node hozen/tools/locsxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const errs=[];
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs]+'・';
 const r=await p.evaluate(f=>{const L=[];let n=0;const add=(name,type,parent)=>{const id='L'+(n++);L.push({id,name,type,parent,note:'',pos:{}});return id};
  ['A棟','B棟'].forEach(bn=>{const b=add(bn,'建屋','');['1階','2階'].forEach(fl=>{const f=add(fl,'階',b);['第1電気室','第2電気室'].forEach(rm=>{const r=add(rm,'電気室',f);for(let k=1;k<=3;k++)add('動力盤-'+k,'盤',r)})})});
  S.locs=L;S.equipment=[{id:'G1',code:'G-1',name:'非常用発電機1',kind:'発電機',locId:L.find(x=>x.type==='電気室').id,importance:'A',status:'稼働',place:'',photos:[],docs:[],repairs:[],health:[]}];
  S.settings.fscale=f;save();applyFScale();go('locs');locFold(true);
  const out=[];
  for(const it of document.querySelectorAll('.locn>.item')){const ti=it.querySelector('.bd>.ti');if(!ti||!ti.offsetParent)continue;const fz=parseFloat(getComputedStyle(ti).fontSize);
   if(ti.getBoundingClientRect().width<fz*3)out.push('名前の欄が細すぎる「'+ti.textContent.trim()+'」（'+Math.round(ti.getBoundingClientRect().width)+'px）')}
  for(const bt of [...document.querySelectorAll('#app button')].filter(x=>/ぜんぶ (たたむ|ひらく)/.test(x.textContent))){
   const tn=[...bt.childNodes].find(x=>x.nodeType===3);const t=tn.textContent;let prev=null;
   for(let i=0;i<t.length;i++){if(!t[i].trim()){prev=null;continue}const rg=document.createRange();rg.setStart(tn,i);rg.setEnd(tn,i+1);const q=rg.getClientRects()[0];if(!q)continue;const top=Math.round(q.top);
    if(prev!=null&&top>prev+2)out.push('「'+t.trim()+'」が「'+t.slice(0,i)+'/'+t.slice(i)+'」と割れる');prev=top}}
  if(document.documentElement.scrollWidth>innerWidth+1)out.push('はみ出す '+document.documentElement.scrollWidth);
  return out},fs);
 for(const x of r)errs.push(tag+x);
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
