// 不具合の設備選び：設備60台で探す欄に入れると候補が絞れ、選んで保存した equipId が今までと同じ形・エラーなし
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>{S.equipment=S.equipment||[];for(let i=0;i<60;i++)S.equipment.push({id:'eqp'+i,code:'E'+i,name:'設備'+(i===42?'ポンプ':'X')+i,kind:'その他'});go('issues');editIssue(null,{})});
 await p.waitForTimeout(400);
 const n0=await p.evaluate(()=>document.querySelectorAll('#is_equip option').length);
 await p.evaluate(()=>{document.querySelector('#is_more').open=true});await p.fill('.eqfind','ポンプ');await p.waitForTimeout(200);
 const n1=await p.evaluate(()=>document.querySelectorAll('#is_equip option').length);
 if(!(n0>60&&n1===2))bad.push('絞れない '+n0+'→'+n1);
 await p.selectOption('#is_equip','eqp42');await p.fill('#is_title','探す確認');
 await p.evaluate(()=>saveIssue(null));await p.waitForTimeout(300);
 const eq=await p.evaluate(()=>{const i=S.issues.find(x=>x.title==='探す確認');return i&&i.equipId});
 if(eq!=='eqp42')bad.push('equipId が保存されない '+eq);
 const w=await p.evaluate(()=>document.documentElement.scrollWidth);if(w>392)bad.push('横にはみ出す '+w);
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
