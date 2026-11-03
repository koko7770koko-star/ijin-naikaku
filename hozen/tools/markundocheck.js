// ◯→● を押し間違えたとき、すぐ戻せるかの確認：年間計画と盤の点検で ● にした直後に「元に戻す」が出て、押すと表示も保存も ◯ に戻る（保存の値は ○／済 のまま）。
const {chromium}=require('playwright');const path=require('path');const FILE=path.resolve(__dirname,'..','index.html');const KEY='hospElecSched_v1';const bad=[];
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true});const p=await c.newPage();const errs=[];
 p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('dialog',d=>d.dismiss().catch(()=>{}));
 await c.route('**/*',r=>/^(file|data|blob):/.test(r.request().url())?r.continue():r.abort());
 await p.goto('file://'+FILE);await p.waitForFunction(()=>typeof S==='object'&&S&&document.querySelector('#app')&&document.querySelector('#app').children.length>0);
 await p.evaluate(()=>{S.items=[{id:'it1',name:'確認項目',cat:'その他',cycle:'毎月'}];S.locs=[{id:'b1',name:'A棟',type:'建屋',parent:''},{id:'f1',name:'1F',type:'階',parent:'b1'},{id:'k1',name:'盤1',type:'盤',parent:'f1'}];S.marks={};S.banChk={};save();go('year')});await p.waitForTimeout(300);
 const bar=async()=>p.evaluate(()=>{const e=document.querySelector('#undobar');const bt=e&&e.querySelector('button');return {on:!!e&&e.classList.contains('on'),h:bt?bt.getBoundingClientRect().height:0,t:e?e.textContent:''}});
 const saved=()=>p.evaluate(([k])=>{const o=JSON.parse(localStorage.getItem(k)||'{}');return JSON.stringify(o.marks||{})},[KEY]);
 const cell=p.locator('table.yr td.mk').nth(3);
 await cell.tap();await p.waitForTimeout(100);let r=await bar();if(r.on)bad.push('◯ にしただけで元に戻すが出る');
 await cell.tap();await p.waitForTimeout(150);r=await bar();if(!r.on)bad.push('年間計画：● にしても元に戻すが出ない');else if(r.h<44)bad.push('元に戻すが44px未満: '+r.h);
 await p.locator('#undobar button').tap();await p.waitForTimeout(200);
 const t=await p.$$eval('table.yr td.mk',a=>a[3].textContent);if(t!=='◯')bad.push('年間計画：元に戻しても ◯ に戻らない: '+t);
 const sv=await p.evaluate(()=>JSON.stringify(S.marks[V.fy].it1[3]));if(sv!=='"○"')bad.push('年間計画：保存値が ○ に戻らない: '+sv);
 // 盤の点検
 await p.evaluate(()=>go('ban'));await p.waitForTimeout(300);
 const bm=p.locator('.banrow .bm').first();
 await bm.tap();await p.waitForTimeout(100);await bm.tap();await p.waitForTimeout(150);r=await bar();if(!r.on)bad.push('盤：● にしても元に戻すが出ない');
 await p.locator('#undobar button').tap();await p.waitForTimeout(200);
 const bv=await p.evaluate(()=>S.banChk[V.banYm||TODAY.slice(0,7)].k1[0]);if(bv!=='○')bad.push('盤：元に戻しても ○ に戻らない: '+bv);
 // ● をもう一度押して空にしたときも戻せる
 await bm.tap();await p.waitForTimeout(100);await bm.tap();await p.waitForTimeout(150);r=await bar();if(!r.on)bad.push('盤：● を外しても元に戻すが出ない');
 await p.locator('#undobar button').tap();await p.waitForTimeout(200);
 const bw=await p.evaluate(()=>S.banChk[V.banYm||TODAY.slice(0,7)].k1[0]);if(bw!=='済')bad.push('盤：● を外して戻しても ● に戻らない: '+bw);
 if(await p.evaluate(()=>document.documentElement.scrollWidth)>392)bad.push('横にはみ出す');
 console.log([...errs,...bad].join('\n')||'NO ERRORS');await b.close();process.exit(errs.length||bad.length?1:0)})();
