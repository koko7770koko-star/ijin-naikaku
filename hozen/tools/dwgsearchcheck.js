// 図面一覧：60件あっても名前で探せる（350ms待ち・入力中に欄から外れない）・件数が出る・空に戻す・見つからない案内・390pxではみ出さない・状態は保存しない
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844}});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{S.drawings=[...Array(60)].map((_,k)=>({id:'d'+k,name:(k%2?'受変電':'配電盤')+'の図面'+k,kind:k%3?'単線結線図':'配置図',locId:'',vers:[{id:'v'+k,ver:'1',date:TODAY,note:'',by:'',file:'',type:''}],pins:[]}));go('dwgs')});await p.waitForTimeout(400);
 const n0=await p.evaluate(()=>document.querySelectorAll('#app .item').length);if(n0!==60)bad.push('全件が出ない '+n0);
 await p.click('#dwgQ');await p.keyboard.type('受変電 図面1');await p.waitForTimeout(700);
 const r=await p.evaluate(()=>({n:document.querySelectorAll('#app .item').length,f:document.activeElement&&document.activeElement.id,t:document.querySelector('#app h2').textContent,sw:document.documentElement.scrollWidth}));
 if(r.f!=='dwgQ')bad.push('入力中に欄から外れた');
 if(r.n<1||r.n>=60)bad.push('絞れない '+r.n);
 if(!/\/ 60件/.test(r.t))bad.push('件数が出ない '+r.t);
 if(r.sw>392)bad.push('はみ出す');
 await p.fill('#dwgQ','存在しない言葉');await p.waitForTimeout(700);
 if(!(await p.evaluate(()=>document.querySelector('#app').innerText)).includes('見つかりません'))bad.push('見つからない案内が無い');
 await p.fill('#dwgQ','');await p.waitForTimeout(700);
 if(await p.evaluate(()=>document.querySelectorAll('#app .item').length)!==60)bad.push('空に戻しても全件に戻らない');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
