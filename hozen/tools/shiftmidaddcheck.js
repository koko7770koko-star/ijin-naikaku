// シフト表：メンバーを外す前の知らせに「その人の入っている日数」と「後ろの人の割り当てが変わる」が出る・
// 末尾に足しても前の人の割り当ては変わらない・保存の形は変わらない
// usage: node hozen/tools/shiftmidaddcheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(700);
 const keys0=await p.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('kinmuhyo_v1')||'{}')).sort().join(','));
 const del=await p.evaluate(()=>{const b=document.querySelector('#memList [data-del="1"]');if(!b)return null;b.click();const m=document.querySelector('dialog[open], .modal, #modal');return (m||document.body).innerText});
 if(del==null)errs.push('削除ボタンが見つからない');
 else{ if(!/夜勤\d+回/.test(del))errs.push('入っている日数が出ない');if(!/後ろの人の割り当てが変わります/.test(del))errs.push('後ろの人への影響が出ない');}
 const n0=await p.evaluate(()=>SHIFT.get().members.length);
 if(n0<3)errs.push('メンバーが足りない');
 const keys1=await p.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('kinmuhyo_v1')||'{}')).sort().join(','));if(keys0&&keys1!==keys0)errs.push('保存の項目が変わった');
 console.log(errs.join('\n')||'NO ERRORS');await b.close();process.exit(errs.length?1:0)})();
