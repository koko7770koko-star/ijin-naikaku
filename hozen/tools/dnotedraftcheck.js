// 日報：記録から特記事項の下書きを入れる（ネット不要）・書いた文は消さず後ろに足す・記録が無ければ入れない・44px・はみ出さない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{S.dnotes={};S.issues=[];S.daily={};go('dailyRep',{day:TODAY});render()});await p.waitForTimeout(200);
 const m=await p.evaluate(()=>{const x=document.getElementById('dnDraft');if(!x)return null;const r=x.getBoundingClientRect();return{h:r.height,sw:document.documentElement.scrollWidth}});
 if(!m)bad.push('ボタンが出ない');else{if(m.h<44)bad.push('小さい '+m.h);if(m.sw>392)bad.push('はみ出す')}
 await p.click('#dnDraft');await p.waitForTimeout(200);
 if(await p.evaluate(()=>S.dnotes[TODAY]))bad.push('記録が無いのに入った');
 await p.evaluate(()=>{S.issues.push({id:'t1',date:TODAY,title:'テスト異常',status:'未対応',place:'',action:''});S.dnotes[TODAY]='手で書いた文';render()});
 await p.click('#dnDraft');await p.waitForTimeout(200);
 const v=await p.evaluate(()=>S.dnotes[TODAY]);
 if(!/^手で書いた文\n/.test(v||''))bad.push('書いた文が消えた/後ろに足されない '+v);
 if(!/テスト異常/.test(v||''))bad.push('異常案件が入らない '+v);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
