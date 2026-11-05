// 盤の点検表の印刷（A4）：盤が多くて表が2ページ以上になっても、全ての行の左の「階・電気室」欄が空にならず（ページの先頭の行でも場所が分かる）、
// 表が紙の幅からはみ出さず、◯ ● 延 の字が 10pt 以上で、行が割れない指定が効き、画面のボタンが印刷に出ないことを確かめる（hz-ban-print-a4）。
// usage: node hozen/tools/banprinta4check.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();
 for(const [w,h] of [[794,1123],[1123,794]]){
 const ctx=await b.newContext({viewport:{width:w,height:h}});const p=await ctx.newPage();p.on('pageerror',e=>bad.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app').children.length>0,null,{timeout:15000});
 await p.evaluate(()=>{const L=[];let n=0;const mk=(id,name,type,parent)=>L.push({id,name,type,parent,note:'',pos:{}});
  mk('b0','例：A棟','建屋','');mk('f1','1階','階','b0');mk('f2','2階','階','b0');
  [['f1',1,30],['f1',2,12],['f2',1,16]].forEach(([f,r,c])=>{const rid='r'+f+r;mk(rid,'第'+r+'電気室','電気室',f);for(let k=0;k<c;k++){n++;mk('p'+n,'動力盤-'+n,'盤',rid)}});
  S.locs=L;const ym=TODAY.slice(0,7);S.banChk={};S.banChk[ym]={};L.filter(x=>x.type==='盤').forEach((x,i)=>S.banChk[ym][x.id]=[['済','○','延'][i%3],['○','済','済'][i%3],['','○','済'][i%3]]);
  window.print=()=>{};go('ban');banPrintBlank(true);document.body.classList.add('bbp')});
 await p.waitForTimeout(300);await p.emulateMedia({media:'print'});
 const r=await p.evaluate(()=>{const o=[];const t=document.querySelector('.banprint table.bpt');if(!t)return ['表が無い'];
  const rows=[...t.querySelectorAll('tbody tr')];if(rows.length<50)o.push('行が少ない '+rows.length);
  rows.forEach(tr=>{if(!tr.cells[0].textContent.trim())o.push('場所の欄が空の行 '+tr.cells[1].textContent)});
  const bp=document.querySelector('.banprint');if(bp.scrollWidth>bp.clientWidth+1||t.getBoundingClientRect().right>innerWidth+1)o.push('表が右にはみ出す');
  const fs=parseFloat(getComputedStyle(t.querySelector('td.bx')).fontSize);if(fs<13)o.push('印の字が小さい '+fs+'px');
  if(getComputedStyle(rows[0]).breakInside!=='avoid')o.push('行が割れない指定が無い');
  const vis=[...document.querySelectorAll('#app button, #nav, .topbar, header')].filter(e=>e.offsetParent&&e.getBoundingClientRect().height>0&&getComputedStyle(e).display!=='none');if(vis.length)o.push('画面だけの物が印刷に出る '+vis.slice(0,3).map(e=>e.className||e.tagName).join(','));
  return o});
 r.forEach(x=>bad.push(w+'x'+h+' '+x));await ctx.close()}
 console.log([...new Set(bad)].join('\n')||'NO ERRORS');await b.close();process.exit(bad.length?1:0)})();
