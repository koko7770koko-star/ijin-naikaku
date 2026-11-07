// 技術資料（lib）：200 件（本文は各 3000 字）で、検索が 1 秒以内に出て、当たった所（根拠の <mark>）が分かり、長い題・英数字の列でも 390px・特大ではみ出さない（hz-v-lib-many）。
// 保存の形（S.library）は変えない。通信は止める。
// usage: node hozen/tools/lib200check.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const keys0=await p.evaluate(()=>Object.keys(S).sort().join(','));
 const t0=await p.evaluate(()=>{const filler='これは資料の本文です。受変電設備の点検手順と注意事項を記します。'.repeat(60);
  S.library=Array.from({length:200},(_,i)=>({id:'l'+i,title:(i%10===0?'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-':'資料')+(i+1),tags:'タグ'+(i%7)+' VCB',text:filler+(i%20===3?' 絶縁抵抗測定の判定基準は500Vで1MΩ以上。':'')+filler,file:'',type:'',equipIds:[]}));
  const t=performance.now();V.libQ='';go('lib');return performance.now()-t});
 if(t0>1000)bad.push('一覧が遅い '+Math.round(t0)+'ms');
 for(const fs of [100,150]){
  await p.evaluate(f=>{document.documentElement.style.fontSize=f+'%'},fs);
  const r=await p.evaluate(()=>{const t=performance.now();V.libQ='絶縁抵抗';render();const ms=performance.now()-t;
   const items=document.querySelectorAll('#app .item'),mk=document.querySelectorAll('#app mark');
   const txt=document.querySelector('#app').textContent;
   return {ms,n:items.length,mk:mk.length,found:(txt.match(/(\d+)件見つかりました/)||[])[1],hint:/先頭の20件/.test(txt),sw:document.documentElement.scrollWidth,over:[...document.querySelectorAll('#app .item')].filter(x=>x.scrollWidth>x.clientWidth+1).length}});
  if(r.ms>1000)bad.push('検索が遅い '+Math.round(r.ms)+'ms('+fs+'%)');
  if(r.found!=='10')bad.push('当たりの件数 '+r.found+'(10 のはず)');
  if(r.mk<10)bad.push('当たった所に印(mark)が付かない '+r.mk);
  if(r.sw>392)bad.push('検索結果で横にはみ出す '+r.sw+'('+fs+'%)');
  if(r.over)bad.push('検索結果の行が切れる '+r.over);
  const r2=await p.evaluate(()=>{V.libQ='';render();return {sw:document.documentElement.scrollWidth,n:document.querySelectorAll('#app .item').length,over:[...document.querySelectorAll('#app .item')].filter(x=>x.scrollWidth>x.clientWidth+1).length}});
  if(r2.n!==200)bad.push('一覧が 200 件出ない '+r2.n);
  if(r2.sw>392)bad.push('一覧で横にはみ出す '+r2.sw+'('+fs+'%)');
  if(r2.over)bad.push('一覧の行が切れる '+r2.over+'('+fs+'%)');
 }
 const keys1=await p.evaluate(()=>Object.keys(S).sort().join(','));if(keys0!==keys1)bad.push('保存の項目が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
