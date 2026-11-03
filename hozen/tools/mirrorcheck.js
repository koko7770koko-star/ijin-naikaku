// 保存の写し（IndexedDB）：①記録を入れて保存→localStorage だけ消して開き直す→「予備保存から戻せます」が出て、戻すと記録が戻る
// ②写しの方が古く本体が新しいときは提案が出ない ③写しが壊れていても固まらずに開く。保存の形・キーは変えない。
// usage: node hozen/tools/mirrorcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 const open=async()=>{await p.goto('file://'+FILE);await p.waitForTimeout(1800)};
 await open();
 await p.evaluate(()=>{S.tasks=[{id:'tm1',date:TODAY,time:'',kind:'臨時',cat:S.settings.cats[0],title:'MIRROR_OK',place:'',staff:'',attend:'',status:'予定',result:'',note:'',photos:[]}];save()});await p.waitForTimeout(800);await p.evaluate(()=>mirrorAll());await p.waitForTimeout(500);
 // ① localStorage を消して開き直す
 await p.evaluate(()=>{localStorage.removeItem('hospElecSched_v1');localStorage.removeItem('hospElecSched_v1_at')});
 await p.evaluate(()=>{window.__noSave=true});
 await p.goto('file://'+FILE);await p.waitForTimeout(2200);
 let t=await p.evaluate(()=>document.querySelector('#modal').innerText+' '+(document.querySelector('#mask').classList.contains('on')?'ON':'OFF'));
 if(!/予備保存から戻せます/.test(t))bad.push('①写しからの復元の提案が出ない：'+t.slice(0,80));
 else{await p.click('button:has-text("予備保存の内容に戻す")');await p.waitForTimeout(1500);const v=await p.evaluate(()=>(S.tasks[0]||{}).title);if(v!=='MIRROR_OK')bad.push('①戻しても記録が戻らない '+v)}
 // ② 本体が新しい（写しが古い）ときは提案が出ない
 await p.evaluate(()=>{S.tasks[0].title='NEWER';save()});await p.waitForTimeout(800);
 await p.goto('file://'+FILE);await p.waitForTimeout(2200);
 t=await p.evaluate(()=>document.querySelector('#modal').innerText);if(/予備保存から戻せます/.test(t))bad.push('②本体が新しいのに提案が出た');
 const keep=await p.evaluate(()=>(S.tasks[0]||{}).title);if(keep!=='NEWER')bad.push('②本体の内容が変わった '+keep);
 // ③ 写しが壊れている
 await p.evaluate(()=>new Promise(res=>{const r=indexedDB.databases?indexedDB.databases():Promise.resolve([]);r.then(async ds=>{for(const d of ds){const q=indexedDB.open(d.name);q.onsuccess=()=>{const db=q.result;const names=[...db.objectStoreNames];if(names.includes('m')){const tx=db.transaction('m','readwrite');tx.objectStore('m').put({at:Date.now()+1000,ver:'x',data:'これはJSONではない'},'app');tx.oncomplete=()=>{db.close();res()}}else{db.close();res()}}}})}));
 await p.goto('file://'+FILE);await p.waitForTimeout(2200);
 const ok=await p.evaluate(()=>typeof S==='object'&&!!document.querySelector('#app')&&document.querySelector('#app').children.length>0);if(!ok)bad.push('③写しが壊れていると固まる');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
