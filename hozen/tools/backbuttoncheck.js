// Android の戻るボタン（history.back）：①入力窓が開いているときは窓を閉じるだけで画面は動かない ②画面の戻るは直前の画面
// ③ホームで戻ると1回目は「もう一度…閉じます」の知らせだけでホームのまま。保存の形は変えない。
// usage: node hozen/tools/backbuttoncheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const back=async()=>{await p.evaluate(()=>history.back());await p.waitForTimeout(250)};
 const view=()=>p.evaluate(()=>V.view);
 // ① 入力窓
 await p.evaluate(()=>go('equip'));await p.waitForTimeout(100);await p.evaluate(()=>editEquip());await p.waitForSelector('#e_name');await p.fill('#e_name','入力途中');
 await back();if(await p.evaluate(()=>document.querySelector('#mask').classList.contains('on')))bad.push('入力窓が戻るで閉じない');if(await view()!=='equip')bad.push('入力窓を閉じるときに画面が動いた '+await view());
 // ② 画面の戻る
 await p.evaluate(()=>go('issues'));await p.waitForTimeout(100);await back();if(await view()!=='equip')bad.push('直前の画面に戻らない '+await view());
 await back();if(await view()!=='home')bad.push('ホームまで戻らない '+await view());
 // ③ ホームで戻る
 await p.evaluate(()=>{window.__t=[];const o=window.toast;window.toast=m=>{window.__t.push(m);return o&&o(m)}});
 await back();const t=await p.evaluate(()=>window.__t.join('|'));if(!/もう一度/.test(t))bad.push('ホームで戻っても知らせが出ない '+t);if(await view()!=='home')bad.push('ホームで戻ってホームでなくなった '+await view());
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
