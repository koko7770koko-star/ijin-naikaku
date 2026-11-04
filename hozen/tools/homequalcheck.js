// ホームのお知らせ：資格の期限（60日以内・切れ）の人数。30日後の人・切れた人・期限なしの人で「2人」、0人で出ない、押すと人員へ、390px ではみ出さない。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 const T=()=>p.evaluate(()=>[...document.querySelectorAll('#app .al')].map(e=>e.textContent.replace(/\s+/g,' ')).filter(t=>/資格の期限/.test(t)));
 await p.evaluate(()=>{S.quals={'甲':['第三種'],'乙':['第三種'],'丙':['第三種']};S.qualExp={'甲':{'第三種':addD(TODAY,30)},'乙':{'第三種':addD(TODAY,-5)}};go('home')});await p.waitForTimeout(400);
 let t=await T();if(t.length!==1||!/2人/.test(t[0]))bad.push('2人と出ない '+JSON.stringify(t));
 const sw=await p.evaluate(()=>document.documentElement.scrollWidth);if(sw>392)bad.push('横にはみ出す '+sw);
 await p.evaluate(()=>{const e=[...document.querySelectorAll('#app .al')].find(e=>/資格の期限/.test(e.textContent));e&&e.click()});await p.waitForTimeout(400);
 const v=await p.evaluate(()=>V.view);if(v!=='staff')bad.push('人員が開かない '+v);
 await p.evaluate(()=>{S.qualExp={'甲':{'第三種':addD(TODAY,200)}};go('home')});await p.waitForTimeout(400);
 t=await T();if(t.length)bad.push('0人なのに出る '+JSON.stringify(t));
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
