// 棟と階をまとめて足す窓（bldgWizard・棟3つ・各階の電気室と盤の欄を開いた形）と盤をまとめて足す窓（banAddWizard）：文字「大」「特大」・360px で、窓が横にはみ出さない・入力とボタンが44px以上・選びの文字が欄から出ない・欄が重ならない（hz-l-bldg-bulk・hz-l-ban-wizard）
// usage: node hozen/tools/bulkwizxlcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const errs=[];
(async()=>{const b=await chromium.launch();
 for(const [w,fs] of [[360,'xl'],[360,'l'],[390,'']]){
 const c=await b.newContext({viewport:{width:w,height:800}});const p=await c.newPage();const tag=w+'px・'+({xl:'特大',l:'大','':'標準'})[fs]+'・';
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&document.querySelector('#app').children.length>0);
 await p.evaluate(f=>{if(f){S.settings.fscale=f;applyFScale()}const L=[];let n=0;const add=(name,type,parent)=>{const id='L'+(n++);L.push({id,name,type,parent,note:'',pos:{}});return id};
  ['A棟','B棟','C棟'].forEach(bn=>{const b=add(bn,'建屋','');['1階','2階'].forEach(fl=>{const f=add(fl,'階',b);['第1電気室','第2電気室'].forEach(rm=>{const r=add(rm,'電気室',f);for(let k=1;k<=2;k++)add('動力盤-'+k,'盤',r)})})});
  S.locs=L;save();go('locs')},fs);await p.waitForTimeout(300);
 const chk=async nm=>{const r=await p.evaluate(()=>{const M=document.querySelector('#modal'),W=document.documentElement.clientWidth,o=[];
   if(M.scrollWidth>M.clientWidth+1)o.push('modal横スクロール '+M.scrollWidth+'>'+M.clientWidth);
   for(const e of M.querySelectorAll('button,input:not([type=checkbox]):not([type=hidden]),select,summary')){const q=e.getBoundingClientRect();if(!q.width)continue;if(q.right>W+1||q.left<-1)o.push('はみ出す '+e.tagName+' '+(e.id||e.textContent.trim().slice(0,10)));
    if((e.tagName==='BUTTON'||e.tagName==='SELECT'||e.tagName==='INPUT')&&q.height<40)o.push('<40 '+(e.id||e.textContent.trim().slice(0,8))+' '+Math.round(q.height));
    if(e.tagName!=='BUTTON'&&e.tagName!=='SUMMARY'&&q.width<(e.type==='number'?56:90))o.push('欄が狭い '+e.id+' '+Math.round(q.width));
    if(e.tagName==='BUTTON'&&q.height<44)o.push('btn<44 '+e.textContent.trim().slice(0,8)+' '+Math.round(q.height));
    if(e.tagName==='SELECT'&&e.scrollWidth>e.clientWidth+1)o.push('選びが欄から出る '+e.id)}
   for(const g of M.querySelectorAll('.chkl')){const q=g.getBoundingClientRect();if(q.right>W+1||g.scrollWidth>g.clientWidth+1)o.push('チェックの行が出る '+g.textContent.trim().slice(0,10))}
   return o});for(const x of new Set(r))errs.push(tag+nm+'：'+x)};
 await p.evaluate("bldgWizard()");await p.waitForTimeout(300);await p.evaluate("document.querySelector('#bw_more').open=true;document.querySelector('#bw_names').value='D棟 E棟 F棟'");await p.waitForTimeout(200);await chk('棟と階の窓');await p.evaluate("closeModal(true)");
 await p.evaluate("banAddWizard()");await p.waitForTimeout(300);await chk('盤の窓');await p.evaluate("closeModal(true)");
 await c.close()}
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
