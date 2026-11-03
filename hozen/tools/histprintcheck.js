// 点検履歴の印刷の確認：絞り込んだ結果に「この条件で印刷」が出て（44px）、印刷では検索の画面が消えて表（題・期間・条件・件数）だけになり、
// 長い備考でも A4 縦の幅に収まる・PDF にできる・390pxではみ出さない・記録は変わらない。0 件のときはボタンを出さない。
// usage: node hozen/tools/histprintcheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>{const n=numDefs()[0];if(!n)return null;S.daily={};
  for(let i=0;i<5;i++){const k=addD(TODAY,-i);S.daily[k]={by:'点検者'+i,note:i===1?'長い備考の例。'.repeat(30):'',c:{}};S.daily[k][n.id]=i===2?99999:(n.min!=null&&n.min!==''?+n.min:1)}
  V.hRange='30';V.hItem='';V.hKw='';V.hNg=false;go('hist');return JSON.stringify(S.daily)});
 if(!before)bad.push('数値の点検項目が無い');
 await p.waitForTimeout(300);
 const btn=await p.evaluate(()=>{const e=document.getElementById('hPrintBtn');return e?{h:e.getBoundingClientRect().height,t:e.textContent}:null});
 if(!btn)bad.push('「この条件で印刷」が無い');else{if(btn.h<44)bad.push('ボタンが44px未満 '+btn.h);if(!/5日分/.test(btn.t))bad.push('件数が出ない '+btn.t)}
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('390pxではみ出す');
 if(await p.evaluate(()=>getComputedStyle(document.querySelector('.hprint')).display!=='none'))bad.push('印刷用の表が画面に出ている');
 await p.setViewportSize({width:794,height:1123});await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
 const t=await p.evaluate(()=>{const tb=document.querySelector('.hprint table.hpt'),vis=[...document.querySelectorAll('#app>.card')].filter(e=>getComputedStyle(e).display!=='none').map(e=>e.className);
  return {rows:tb?tb.querySelectorAll('tbody tr').length:0,right:tb?Math.round(tb.getBoundingClientRect().right):0,head:(document.querySelector('.hprint .phd')||{}).innerText||'',vis}});
 if(t.rows!==5)bad.push('印刷の行数 '+t.rows);if(!t.right||t.right>794)bad.push('A4の幅に収まらない '+t.right);
 if(!/点検履歴/.test(t.head)||!/期間/.test(t.head)||!/5日/.test(t.head))bad.push('題・期間・件数が出ない：'+t.head);
 if(t.vis.some(c=>!/hprint/.test(c)))bad.push('印刷に画面のカードが残る：'+t.vis.join('|'));
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});if(buf.length<4000)bad.push('PDFが作れない');if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf);
 await p.emulateMedia({media:'screen'});await p.setViewportSize({width:390,height:844});
 if(await p.evaluate(()=>JSON.stringify(S.daily))!==before)bad.push('印刷で記録が変わった');
 await p.evaluate(()=>{V.hKw='該当しない言葉';render()});await p.waitForTimeout(200);
 if(await p.evaluate(()=>!!document.getElementById('hPrintBtn')))bad.push('0件でも印刷ボタンが出る');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
