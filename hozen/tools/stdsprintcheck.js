// 作業標準の印刷の確認：作業標準の窓の「印刷」から報告書の形（A4縦1枚）で開く・手順の番号・必須・備考が載る・長い文章でも収まる・未承認は明記・記録は変わらない。
// usage: node hozen/tools/stdsprintcheck.js [PDFの出力先]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 const before=await p.evaluate(()=>{const L='長い手順の文章。'.repeat(30)+'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(4);
  S.stds=[{id:'s1',name:'確認用 停電作業標準',docNo:'S-01',ver:'2',kinds:['停電作業'],pre:[{text:'検電する',req:true},{text:L,req:false}],post:[{text:'接地を外す',req:true}],note:'注意メモ',approvedBy:'',approvedRole:'',approvedDate:'',method:'',hist:[]}];save();go('stds');return JSON.stringify(S.stds)});
 await p.waitForTimeout(300);
 await p.evaluate(()=>editStd('s1'));await p.waitForTimeout(200);
 const btn=await p.evaluate(()=>{const e=[...document.querySelectorAll('#modal button,.modal button')].find(x=>/印刷/.test(x.textContent));if(!e)return 0;const h=e.getBoundingClientRect().height;e.click();return h});await p.waitForTimeout(300);
 if(!btn)bad.push('作業標準の窓に「印刷」が無い');else if(btn<44)bad.push('ボタンが44px未満 '+btn);
 const t=await p.evaluate(()=>({view:V.view,txt:document.querySelector('#app').innerText,sw:document.documentElement.scrollWidth}));
 if(t.view!=='printDoc')bad.push('報告書が開かない '+t.view);
 for(const w of ['検電する','接地を外す','注意メモ','S-01','未承認','作業前の確認','作業後の確認'])if(!t.txt.includes(w))bad.push('載らない：'+w);
 if(t.sw>392)bad.push('横にはみ出す '+t.sw);
 await p.setViewportSize({width:794,height:1123});await p.emulateMedia({media:'print'});await p.waitForTimeout(200);
 const w=await p.evaluate(()=>{let m=0;document.querySelectorAll('.rep table').forEach(tb=>m=Math.max(m,Math.round(tb.getBoundingClientRect().right)));return m});if(!w||w>794)bad.push('A4の幅に収まらない '+w);
 const buf=await p.pdf({preferCSSPageSize:true,printBackground:true});if(buf.length<4000)bad.push('PDFが作れない');if(process.argv[2])require('fs').writeFileSync(process.argv[2],buf);
 const after=await p.evaluate(()=>JSON.stringify(S.stds));if(after!==before)bad.push('印刷で記録が変わった');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
