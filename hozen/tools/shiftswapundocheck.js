// 夜勤シフト表：交代（入れ替え）を入れてから「自動に戻す」で取り消すと、changes と日ごとの人数・個人の夜勤回数が元と同じになる確かめ（390px）。
// kinmuhyo_v1 の保存の形（項目）は変えない。
// usage: node hozen/tools/shiftswapundocheck.js
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.click('#nav button[data-v="shift"]');await p.waitForTimeout(800);
 const st=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('kinmuhyo_v1')||'{}'));
 // 画面の数（日ごとの人数の行・個人の合計の列）を文字で取る
 const view=()=>p.evaluate(()=>[...document.querySelectorAll('#shTable tr')].map(r=>[...r.children].map(x=>x.textContent.trim()).join('|')).join('\n'));
 const strip=o=>{const x=JSON.parse(JSON.stringify(o));delete x.hist;delete x.log;delete x.opLog;return JSON.stringify(x)};
 const s0=await st(),v0=await view();
 let done=false;const N=await p.evaluate(()=>document.querySelectorAll('#shTable td.cell').length);
 for(let k=0;k<Math.min(N,120)&&!done;k++){await p.evaluate(()=>document.getElementById('pop').classList.remove('on'));
  await p.evaluate(k=>document.querySelectorAll('#shTable td.cell')[k].click(),k);
  if(!await p.$('#swapBtn'))continue;await p.click('#swapBtn');const o=await p.$('#popSwap [data-sw]');if(!o)continue;
  await o.click();await p.waitForTimeout(300);const ok=await p.$('text=この内容で変更');if(!ok){bad.push('入れ替えの確認が出ない');break}await ok.click();await p.waitForTimeout(400);done=true}
 if(!done){console.log('入れ替えの相手がいないため省略');await b.close();process.exit(0)}
 const s1=await st(),v1=await view();
 if((s1.changes||[]).length<2)bad.push('入れ替えで変更が入らない');if(v1===v0)bad.push('入れ替えても表が変わらない');
 for(let i=0;i<10;i++){const has=await p.evaluate(()=>{const x=document.querySelector('#chgList button');if(x)x.click();return !!x});if(!has)break;await p.waitForTimeout(300);const ok=await p.$('text=この内容で変更');if(!ok){bad.push('取り消しの確認が出ない');break}await ok.click();await p.waitForTimeout(400)}
 const s2=await st(),v2=await view();
 if(JSON.stringify(s2.changes||[])!==JSON.stringify(s0.changes||[]))bad.push('取り消し後の changes が元と違う '+JSON.stringify(s2.changes));
 if(Object.keys(s2).filter(k=>k!=='hist').sort().join()!==Object.keys(s0).filter(k=>k!=='hist').sort().join())bad.push('保存の項目が変わった');
 if(v2!==v0)bad.push('取り消し後の表（人数・回数）が元と違う');
 const a=JSON.parse(strip(s0)),z=JSON.parse(strip(s2));for(const k of Object.keys(a))if(JSON.stringify(a[k])!==JSON.stringify(z[k]))bad.push('取り消し後に '+k+' が元と違う');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
