// 年報：盤の点検の年間の済み件数が棟ごと・月ごとに読める（年次報告書の「6. 盤の点検」）。盤が無ければ出ない。A4縦の印刷幅で表がはみ出さず列が細すぎない。390pxではみ出さない。記録は変わらない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 await p.evaluate(()=>{S.locs=[];S.banChk={};V.rfy=2026;V.rmode='y';go('report')});await p.waitForTimeout(300);
 if(await p.evaluate(()=>/盤の点検（年間/.test(document.querySelector('#app').innerText)))bad.push('盤が無いのに出る');
 const before=await p.evaluate(()=>{const mk=(id,name,type,parent)=>({id,name,type,parent,note:'',pos:{}});
  S.locs=[mk('b1','A棟','建屋',''),mk('f1','1階','階','b1'),mk('p1','盤1','盤','f1'),mk('p2','盤2','盤','f1'),mk('b2','B棟','建屋',''),mk('p3','盤3','盤','b2')];
  S.banChk={'2026-04':{p1:['済','済','済'],p2:['済','','']},'2027-03':{p1:['済','○','済'],p3:['済','済','']},'2026-03':{p1:['済','済','済']}}; /* 2026-03 は前の年度 */
  V.rfy=2026;V.rmode='y';go('report');return JSON.stringify(S.banChk)});await p.waitForTimeout(400);
 const r=await p.evaluate(()=>{const sec=[...document.querySelectorAll('#app .sec')].find(e=>/盤の点検（年間/.test(e.textContent));if(!sec)return null;const t=sec.nextElementSibling.querySelector('table');return {rows:[...t.querySelectorAll('tbody tr')].map(tr=>[...tr.children].map(x=>x.textContent.trim())),heads:[...t.querySelectorAll('th')].map(x=>x.textContent.trim()),sw:document.documentElement.scrollWidth}});
 if(!r)bad.push('年報に「盤の点検（年間）」が無い');else{
  // A棟：4月=4（p1が3＋p2が1）、3月=2（p1の済2）、年間6/72
  const a=r.rows[0],bb=r.rows[1];
  if(a[0]!=='A棟'||a[1]!=='2')bad.push('A棟の行が違う '+a.join('|'));
  if(a[2]!=='4')bad.push('A棟 4月が違う '+a[2]);if(a[13]!=='2')bad.push('A棟 3月が違う '+a[13]);if(!/^6\/72$/.test(a[14]))bad.push('A棟 年間が違う '+a[14]);
  if(bb[0]!=='B棟'||bb[13]!=='2'||!/^2\/36$/.test(bb[14]))bad.push('B棟の行が違う '+bb.join('|'));
  if(r.sw>392)bad.push('390pxではみ出す '+r.sw)}
 await p.setViewportSize({width:718,height:1000});await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
 const w=await p.evaluate(()=>{const sec=[...document.querySelectorAll('#app .sec')].find(e=>/盤の点検（年間/.test(e.textContent));const t=sec&&sec.nextElementSibling.querySelector('table');if(!t)return null;return {over:t.getBoundingClientRect().right>innerWidth+1,narrow:[...t.querySelectorAll('th')].map(c=>[c.textContent.trim(),Math.round(c.getBoundingClientRect().width)]).filter(x=>x[1]<22)}});
 if(!w)bad.push('印刷で表が無い');else{if(w.over)bad.push('印刷幅ではみ出す');if(w.narrow.length)bad.push('列が細すぎる '+JSON.stringify(w.narrow))}
 const after=await p.evaluate(()=>JSON.stringify(S.banChk));if(after!==before)bad.push('記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
