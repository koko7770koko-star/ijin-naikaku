// 日常点検（day）の印刷：数字・○×－・点検者・長い備考を入れた日を印刷すると、操作のボタン（異常なしで記録・前回と同じ・音声・写真・完了・削除・下書き・保存）と
// 月の記録状況が出ず、入れた数字・選んだ ○×－ が紙に出て（背景を印刷しない設定でも分かるよう枠と print-color-adjust）、長い備考が途中で切れず、A4 の幅に収まる・記録は変わらない。
// usage: node hozen/tools/dayprintcheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>{const N=numDefs(),C=chkDefs();const r={by:'点検者',note:'長い備考の例。'.repeat(40),c:{}};N.forEach((n,i)=>r[n.id]=6.6+i);C.forEach((x,i)=>r.c[x.id]=i===1?'×':i===2?'－':'○');S.daily[TODAY]=r;save();go('day',{day:TODAY});return JSON.stringify(S.daily)});
 await p.waitForTimeout(400);
 await p.setViewportSize({width:718,height:1047});await p.emulateMedia({media:'print'});await p.waitForTimeout(300);
 const r=await p.evaluate(()=>{const vis=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.getClientRects().length};
  const btns=[...document.querySelectorAll('#app button,#app label.btn')].filter(e=>vis(e)&&!e.closest('.seg')).map(e=>e.textContent.trim().slice(0,12));
  const sel=[...document.querySelectorAll('#app .seg button[class*="on-"]')].filter(vis).map(e=>{const s=getComputedStyle(e);return {t:e.textContent,o:s.outlineStyle,pa:s.printColorAdjust||s.webkitPrintColorAdjust}});
  const ta=document.getElementById('d_note'),nums=[...document.querySelectorAll('#app .grid3 .num input')].filter(vis).map(e=>e.value);
  const grid=document.getElementById('dayGrid');
  return {btns,sel,ta:ta?{sh:ta.scrollHeight,ch:ta.clientHeight,vis:vis(ta)}:null,nums,grid:grid?vis(grid):false,sw:document.documentElement.scrollWidth,W:innerWidth}});
 if(r.btns.length)bad.push('印刷に操作のボタンが残る '+r.btns.join('|'));
 if(r.grid)bad.push('印刷に月の記録状況が出る');
 if(r.sw>r.W+1)bad.push('A4の幅からはみ出す '+r.sw);
 if(!r.nums.includes('6.6'))bad.push('数字が出ない '+r.nums.join(','));
 const ts=r.sel.map(x=>x.t).join('');if(!/○/.test(ts)||!/×/.test(ts)||!/－/.test(ts))bad.push('選んだ ○×－ が出ない '+ts);
 if(r.sel.some(x=>x.o==='none'||x.pa!=='exact'))bad.push('選んだ印が背景なしの印刷で分からない '+JSON.stringify(r.sel[0]));
 if(!r.ta||!r.ta.vis||r.ta.sh>r.ta.ch+2)bad.push('長い備考が切れる '+JSON.stringify(r.ta));
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:false});if(buf.length<4000)bad.push('PDFが作れない');if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf);
 await p.emulateMedia({media:'screen'});
 if(await p.evaluate(()=>JSON.stringify(S.daily))!==before)bad.push('印刷で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
