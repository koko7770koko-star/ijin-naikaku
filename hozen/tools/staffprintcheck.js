// 人員・資格（staff）の印刷：15 人（資格 3 件・期限つき）と今後 14 日の作業で、A4 縦の幅に収まり、CSV・資格の種類・「資格を登録 ›」が印刷に出ず（登録なしは「資格の登録なし」）、
// 1 件の行がページの境で割れず、各ページの下に題とページ番号が出る（@page の余白枠）・PDF にできる・記録は変わらない。usage: node hozen/tools/staffprintcheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>{S.quals={};S.qualExp={};for(let i=0;i<15;i++){const n='職員'+String.fromCharCode(65+i);if(i%4)S.quals[n]=['第三種電気主任技術者','第一種電気工事士','高圧・特別高圧電気取扱特別教育'];if(i%5===1)S.qualExp[n]={'第三種電気主任技術者':addD(TODAY,20)}}
  save();go('staff');return JSON.stringify([S.quals,S.qualExp])});
 await p.waitForTimeout(300);
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('390pxではみ出す');
 await p.setViewportSize({width:718,height:1047});await p.emulateMedia({media:'print'});await p.waitForTimeout(250);
 const r=await p.evaluate(()=>{const W=innerWidth,vis=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.getClientRects().length};
  const over=[...document.querySelectorAll('#app *')].filter(e=>vis(e)&&e.getBoundingClientRect().right>W+1).slice(0,3).map(e=>e.tagName+'.'+e.className);
  const ctl=[...document.querySelectorAll('#app button,#app select,#app input,#app .tile,#app label.btn,#app .qadd')].filter(vis).map(e=>(e.tagName+':'+(e.textContent||e.placeholder||'')).trim().slice(0,16));
  const rows=[...document.querySelectorAll('#app .item, #app tbody tr')].filter(vis);const bi=rows[0]?getComputedStyle(rows[0]).breakInside:'none';
  return {sw:document.documentElement.scrollWidth,W,over,ctl,bi,n:rows.length,title:document.getElementById('pageStyle').textContent}});
 if(r.sw>r.W+1||r.over.length)bad.push('A4の幅からはみ出す '+r.sw+' '+r.over.join(','));
 if(r.ctl.length)bad.push('印刷に操作の部品が残る '+r.ctl.join('|'));
 if(r.n<15)bad.push('15人が出ない '+r.n);const nq=await p.evaluate(()=>[...document.querySelectorAll('#app .mprint')].filter(e=>getComputedStyle(e).display!=='none'&&/資格の登録なし/.test(e.textContent)).length);if(nq<3)bad.push('登録なしの人に「資格の登録なし」が出ない '+nq);
 if(r.n&&r.bi!=='avoid'&&r.bi!=='avoid-page')bad.push('行がページの境で割れる（break-inside '+r.bi+'）');
 if(!/"counter\(page\)/.test(r.title))bad.push('ページの下に題・ページ番号が出ない '+r.title);
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});if(buf.length<4000)bad.push('PDFが作れない');if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf);
 await p.emulateMedia({media:'screen'});
 if(await p.evaluate(()=>JSON.stringify([S.quals,S.qualExp]))!==before)bad.push('印刷で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
