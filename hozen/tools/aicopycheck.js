// AI支援：下書きが出たら「コピー」で文字を持ち出せる（記録に使う下書きにも）・コピーできない端末では文字を選んだ状態にして案内・通信は止めて確認（ダミーのキー）
// usage: node hozen/tools/aicopycheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},permissions:['clipboard-read','clipboard-write']});const p=await c.newPage();const errs=[];let sent=0;
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>{const u=r.request().url();if(/^(file|data|blob):/.test(u))return r.continue();if(/anthropic/.test(u)){sent++;return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({content:[{type:'text',text:'試験の下書きです。'}]})})}r.abort()});
 await p.goto('file://'+FILE);await p.waitForTimeout(1200);
 await p.evaluate(()=>{sessionStorage.setItem(KEYSTORE,'dummy-not-a-key')});
 const run=async use=>{await p.evaluate(u=>aiDraft('試験','テスト本文','使う',u?(t=>{window.__used=t}):null),use);await p.waitForTimeout(200);await p.click('text=この内容を送る');await p.waitForSelector('#ai_text',{timeout:5000});};
 // 記録に使う下書き
 await run(true);
 const h=await p.evaluate(()=>{const e=document.querySelector('#ai_copy');return e?e.getBoundingClientRect().height:0});if(h<44)bad.push('使う下書きにコピーが無い・小さい '+h);
 await p.click('#ai_copy');await p.waitForTimeout(300);
 const cb=await p.evaluate(()=>navigator.clipboard.readText().catch(()=>'ERR'));if(cb!=='試験の下書きです。')bad.push('コピーされない '+cb);
 if(!/コピーしました/.test(await p.evaluate(()=>document.body.innerText)))bad.push('「コピーしました」が出ない');
 if(await p.evaluate(()=>window.__used!==undefined))bad.push('コピーしただけで記録に使われた');
 // コピーが使えない端末：選んだ状態＋案内
 await p.evaluate(()=>{Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('x'))},configurable:true})});
 await p.click('#ai_copy');await p.waitForTimeout(300);
 if(!/選択しました/.test(await p.evaluate(()=>document.body.innerText)))bad.push('コピーできないときの案内が出ない');
 await p.evaluate(()=>closeModal(true));
 // 使うだけでない（コピーだけの）下書き
 await run(false);if(!await p.$('#modal button[onclick="copyDraft()"]'))bad.push('コピーだけの下書きにコピーが無い');
 if(await p.evaluate(()=>document.documentElement.scrollWidth>392))bad.push('横にはみ出す');
 if(!sent)bad.push('通信の確認が働いていない');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
