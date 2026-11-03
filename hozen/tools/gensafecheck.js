// 世代バックアップの確認：(1) 履歴への書き込みが容量不足で一度失敗しても、古い世代を整理して1回やり直し、保存できる（最新は残る）
// (2) 戻す前の確認に「今」と「戻す先」の件数が出る (3) 戻した直後に「元に戻す」で元の状態に戻る (4) 履歴の一覧が390pxではみ出さない。保存の形は変えない。
// usage: node hozen/tools/gensafecheck.js [撮影先.png]
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];let confirmMsg='';
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>{if(d.type()==='confirm')confirmMsg=d.message();d.accept().catch(()=>{})});
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForTimeout(1500);
 // 世代を30件つくる
 await p.evaluate(async()=>{for(let i=0;i<30;i++){await snapshot('試し'+i,null,true);await new Promise(r=>setTimeout(r,3))}});
 const n0=await p.evaluate(async()=>(await listGenerations()).length);if(n0<30)bad.push('世代が30件にならない '+n0);
 // 1回目の put だけ失敗させる
 const r=await p.evaluate(async()=>{const o=window.idb;let fails=1;
  const orig=idb;idb=function(st,mode,fn){if(mode==='readwrite'&&fails>0&&/put/.test(String(fn))){fails--;return Promise.reject(new Error('QuotaExceededError'))}return orig(st,mode,fn)};
  const ok=await snapshot('容量不足のあと',null,true);idb=orig;
  const gs=await listGenerations();return {ok,n:gs.length,top:gs[0]&&gs[0].reason}});
 if(!r.ok)bad.push('容量不足のあと保存できない');if(r.top!=='容量不足のあと')bad.push('最新の世代が違う '+r.top);if(r.n>=n0)bad.push('古い世代を整理していない '+r.n);if(r.n<4)bad.push('整理しすぎ '+r.n);
 // 戻す：件数の表示と元に戻す
 await p.evaluate(()=>{S.tasks=[];S.issues=[];save()});
 await p.evaluate(async()=>{await snapshot('戻す先',null,true)});
 await p.evaluate(()=>{S.issues=[{id:'iz1',date:TODAY,title:'あとで増えた異常',place:'',detail:'',status:'発見',action:'',closed:'',photos:[],equipId:'',log:[]}];save()});
 await p.evaluate(async()=>{const gs=await listGenerations();window.__k=gs.find(g=>g.reason==='戻す先').key;await restoreGeneration(window.__k)});await p.waitForTimeout(700);
 if(!confirmMsg.includes('今')||!confirmMsg.includes('戻す先')||!/異常1/.test(confirmMsg)||!/異常0/.test(confirmMsg))bad.push('確認の件数表示 '+confirmMsg);
 let n=await p.evaluate(()=>S.issues.length);if(n!==0)bad.push('戻した後の異常 '+n);
 const ub=await p.evaluate(()=>document.querySelector('#undobar').classList.contains('on'));if(!ub)bad.push('元に戻すバーが出ない');
 await p.evaluate(()=>document.querySelector('#undobar button').click());await p.waitForTimeout(300);
 n=await p.evaluate(()=>S.issues.length);if(n!==1)bad.push('元に戻した後の異常 '+n);
 const ls=await p.evaluate(()=>JSON.parse(localStorage.getItem('hospElecSched_v1')).issues.length);if(ls!==1)bad.push('保存値 '+ls);
 await p.evaluate(()=>showGenerations());await p.waitForTimeout(600);
 const m=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,mw:document.querySelector('#modal').getBoundingClientRect().width}));if(m.sw>392||m.mw>390)bad.push('履歴の窓がはみ出す '+JSON.stringify(m));
 if(process.argv[2])await p.screenshot({path:process.argv[2]});
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
