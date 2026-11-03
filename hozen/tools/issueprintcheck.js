// 未完了の異常の一覧（会議・引き継ぎで配る用）の確認：異常・修理の画面の「未完了を印刷」から報告書の形で開き、完了した物は載らない・
// 長い文章でも表が紙の幅（A4縦）に収まる・390pxで横にはみ出さない・PDFにできる・記録は変わらない。保存の形は変えない。
// usage: node hozen/tools/issueprintcheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>{const L='長い文章の例。'.repeat(40)+'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(5);
  S.equipment=[{id:'e1',code:'T-1',name:'確認用変圧器',kind:'変圧器',status:'稼働',locId:'',place:'',run:{meters:[]}}];
  S.issues=[{id:'i1',date:TODAY,title:'異音',detail:L,action:'',cause:'',status:'未対応',urgency:'高',equipId:'e1',place:'',photos:[]},
   {id:'i2',date:'2020-01-01',title:'完了した件',detail:'',action:'',cause:'',status:'完了',urgency:'低',equipId:'',place:'',photos:[]},
   {id:'i3',date:TODAY,title:'漏水',detail:'',action:'',cause:'',status:'対応中',urgency:'緊急',equipId:'',place:'○○室',photos:[]}];save();go('issues');return JSON.stringify(S.issues)});
 await p.waitForTimeout(300);
 const btn=await p.evaluate(()=>{const e=[...document.querySelectorAll('#app button')].find(x=>/未完了を印刷/.test(x.textContent));if(!e)return 0;const h=e.getBoundingClientRect().height;e.click();return h});await p.waitForTimeout(300);
 if(!btn)bad.push('異常の画面に「未完了を印刷」が無い');else if(btn<44)bad.push('ボタンが44px未満 '+btn);
 const t=await p.evaluate(()=>({view:V.view,rows:document.querySelectorAll('.rep table:first-of-type tr').length,txt:document.querySelector('#app').innerText,sw:document.documentElement.scrollWidth}));
 if(t.view!=='printDoc')bad.push('報告書が開かない '+t.view);if(t.rows!==3)bad.push('行数 '+t.rows+'（見出し+2件のはず）');if(t.txt.includes('完了した件'))bad.push('完了した件が載っている');
 if(!/漏水/.test(t.txt)||!/異音/.test(t.txt))bad.push('未完了の件が載らない');if(t.txt.indexOf('漏水')>t.txt.indexOf('異音'))bad.push('緊急度順でない');if(t.sw>392)bad.push('横にはみ出す '+t.sw);
 await p.setViewportSize({width:794,height:1123});await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
 const w=await p.evaluate(()=>{const tb=document.querySelector('.rep table');return tb?Math.round(tb.getBoundingClientRect().right):0});if(!w||w>794)bad.push('A4の幅に収まらない '+w);
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});if(buf.length<4000)bad.push('PDFが作れない');if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf);
 const after=await p.evaluate(()=>JSON.stringify(S.issues));if(after!==before)bad.push('印刷で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
