// 設定：施設名を変えると「保存しました」が出る。入れかけ（Enter も blur もしない）で別の画面へ移っても消えない。読み直すと残る。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>go('set',{setTab:'basic'}));await p.waitForTimeout(300);
 const inp=p.locator('#app input[placeholder*="総合病院"]').first();
 await inp.fill('○○総合病院');await inp.blur();await p.waitForTimeout(150);
 const t=await p.evaluate(()=>{const e=document.querySelector('#toast');return e&&e.classList.contains('on')?e.textContent:''});
 if(!/保存しました/.test(t))bad.push('変えても知らせが出ない '+t);
 // 入れかけで別の画面へ（フォーカスしたまま、下のメニューを押す）
 await inp.fill('△△医療センター');await p.evaluate(()=>go('home'));await p.waitForTimeout(150);
 let nm=await p.evaluate(()=>S.settings.name);
 await p.evaluate(()=>go('set',{setTab:'basic'}));await p.waitForTimeout(200);
 const inp2=p.locator('#app input[placeholder*="総合病院"]').first();await inp2.click();await inp2.fill('△△医療センター');
 const nav=await p.$('#nav button[data-v=home]');
 if(nav){await nav.click();await p.waitForTimeout(200);nm=await p.evaluate(()=>S.settings.name);if(nm!=='△△医療センター')bad.push('入れかけで画面を移ると消える '+nm)}
 await p.reload();await p.waitForTimeout(1200);
 const kept=await p.evaluate(()=>S.settings.name);if(!/医療センター|総合病院/.test(kept))bad.push('読み直すと消える '+kept);
 if(await p.evaluate(()=>document.documentElement.scrollWidth>392))bad.push('横にはみ出す');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
