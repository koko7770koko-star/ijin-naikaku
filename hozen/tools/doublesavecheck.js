// 異常の記録：保存ボタンを素早く2回押しても同じ記録が2件できないことの確認（390px）。
// usage: node hozen/tools/doublesavecheck.js
const {chromium}=require('playwright');const path=require('path');
const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.accept().catch(()=>{}));
 await ctx.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof MIRROR_READY!=='undefined'&&MIRROR_READY&&typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0,null,{timeout:15000});await p.waitForTimeout(150);
 await p.evaluate(()=>go('issues'));await p.waitForTimeout(300);
 await p.click('text=＋');await p.waitForTimeout(500);
 await p.keyboard.type('二重押し確認');
 // 同じ瞬間に2回押す（confirm は承諾する設定なので、重複の確認では止まらない）
 const n=await p.evaluate(()=>{const btn=[...document.querySelectorAll('#modal .btn')].find(x=>x.textContent.trim()==='保存');btn.click();btn.click();return S.issues.filter(i=>i.title==='二重押し確認').length});
 await p.waitForTimeout(500);
 const m=await p.evaluate(()=>S.issues.filter(i=>i.title==='二重押し確認').length);
 if(n!==1||m!==1)bad.push('同じ記録が '+m+' 件できた（直後 '+n+'）');
 // 新規画面を開き直して、保存→すぐ同じ内容でもう一度保存の動き（重複の確認は従来どおり）
 const keys=await p.evaluate(()=>Object.keys(S.issues.find(i=>i.title==='二重押し確認')).sort().join(','));
 console.log('保存した項目:',keys);
 errs.forEach(e=>bad.push(e));
 console.log(bad.length?'NG\n'+bad.join('\n'):'OK doublesavecheck');await b.close();process.exit(bad.length?1:0)})();
